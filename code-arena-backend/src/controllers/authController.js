import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { generateAccessToken } from "../utils/generateToken.js";
import ApiError from "../utils/ApiError.js";

const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  rating: true,
  createdAt: true,
};

function getPassword(value) {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    Buffer.byteLength(value, "utf8") > 72
  ) {
    throw new ApiError(400, "Password must be between 8 and 72 characters.");
  }
  return value;
}

function getUsername(body, email) {
  const supplied =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const fromName =
    typeof body.name === "string"
      ? body.name.toLowerCase().replace(/[^a-z0-9_]/g, "")
      : "";
  const fromEmail = email.split("@")[0].replace(/[^a-z0-9_]/g, "");
  const username = supplied || fromName || fromEmail;

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new ApiError(
      400,
      "Username must be 3-30 characters and contain only letters, numbers, or underscores.",
    );
  }
  return username;
}

export async function register(req, res) {
  const { email: rawEmail, name, displayName } = req.body ?? {};
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = getPassword(req.body?.password);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  const username = getUsername(req.body, email);
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName:
          (typeof displayName === "string" && displayName.trim()) ||
          (typeof name === "string" && name.trim()) ||
          username,
      },
      select: publicUserSelect,
    });

    return res.status(201).json({
      success: true,
      message: "Account created.",
      token: generateAccessToken(user.id),
      user,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "That email or username is already registered.");
    }
    throw error;
  }
}

export async function login(req, res) {
  const loginId =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : typeof req.body?.username === "string"
        ? req.body.username.trim().toLowerCase()
        : "";
  const password = req.body?.password;

  if (!loginId || typeof password !== "string" || password.length === 0) {
    throw new ApiError(400, "Email or username and password are required.");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: loginId }, { username: loginId }],
    },
    select: { ...publicUserSelect, passwordHash: true, isActive: true },
  });

  const passwordMatches =
    user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordMatches || !user.isActive) {
    throw new ApiError(401, "Invalid email/username or password.");
  }

  const { passwordHash, isActive, ...publicUser } = user;
  return res.json({
    success: true,
    message: "Login successful.",
    token: generateAccessToken(user.id),
    user: publicUser,
  });
}

export async function getCurrentUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: publicUserSelect,
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  return res.json({ success: true, user });
}

export async function logout(req, res) {
  return res.json({
    success: true,
    message: "Logged out. Remove the access token from the client.",
  });
}

export default { register, login, getCurrentUser, logout };