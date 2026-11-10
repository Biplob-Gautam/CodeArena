import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import { verifyRefreshToken } from "../config/jwt.js";
import ApiError from "../utils/ApiError.js";

const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  role: true,
  rating: true,
  ratingDeviation: true,
  bestRating: true,
  createdAt: true,
};

function normalizeEmail(email) {
  if (typeof email !== "string") {
    throw new ApiError(400, "A valid email address is required.");
  }
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new ApiError(400, "A valid email address is required.");
  }
  return normalized;
}

function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new ApiError(400, "Password must be between 8 and 72 bytes (at least 8 characters).");
  }
}

function normalizeUsername(username) {
  const normalized = typeof username === "string" ? username.trim().toLowerCase() : "";
  if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
    throw new ApiError(
      400,
      "Username must be 3-30 characters and contain only letters, numbers, or underscores.",
    );
  }
  return normalized;
}

function issueTokens(user) {
  return {
    token: generateAccessToken(user.id),
    refreshToken: generateRefreshToken(user.id),
  };
}

export async function registerUser({ email, username, password, displayName }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  validatePassword(password);

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,
        displayName:
          typeof displayName === "string" ? displayName.trim().slice(0, 120) || null : null,
      },
      select: publicUserSelect,
    });

    return { user, ...issueTokens(user) };
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "That email or username is already registered.");
    }
    throw error;
  }
}

export async function loginUser({ email, username, password }) {
  const loginId = normalizeEmailOrUsername(email ?? username);
  if (typeof password !== "string" || password.length === 0) {
    throw new ApiError(400, "Password is required.");
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: loginId }, { username: loginId }] },
    select: { ...publicUserSelect, passwordHash: true, isActive: true },
  });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email/username or password.");
  }

  const { passwordHash, isActive, ...safeUser } = user;
  return { user: safeUser, ...issueTokens(user) };
}

function normalizeEmailOrUsername(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "Email or username is required.");
  }
  return value.trim().toLowerCase();
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) throw new ApiError(404, "User not found.");
  return user;
}

export async function authenticateRefreshToken(token) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    throw new ApiError(401, "Refresh token is invalid or expired.");
  }
  if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") {
    throw new ApiError(401, "Refresh token payload is invalid.");
  }
  const user = await prisma.user.findFirst({
    where: { id: payload.sub, isActive: true },
    select: publicUserSelect,
  });
  if (!user) throw new ApiError(401, "User account is unavailable.");
  return { user, ...issueTokens(user) };
}

export default { registerUser, loginUser, getUserById, authenticateRefreshToken };