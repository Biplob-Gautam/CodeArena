import { prisma } from "../config/database.js";
import { verifyAccessToken } from "../config/jwt.js";
import ApiError from "../utils/ApiError.js";

export async function authenticate(req, res, next) {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return next(new ApiError(401, "A valid Bearer access token is required."));
  }

  let payload;
  try {
    payload = verifyAccessToken(match[1]);
  } catch {
    return next(new ApiError(401, "Access token is invalid or expired."));
  }

  if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") {
    return next(new ApiError(401, "Access token payload is invalid."));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        rating: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new ApiError(401, "User account is unavailable."));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(...roles) {
  if (roles.length === 0 || roles.some((role) => typeof role !== "string")) {
    throw new TypeError("requireRole needs one or more role names.");
  }

  return function roleAuthorization(req, res, next) {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required."));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to access this resource."));
    }
    return next();
  };
}

export const requireAdmin = requireRole("ADMIN");
export const authMiddleware = authenticate;
export default authenticate;