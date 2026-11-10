import {
  signAccessToken,
  signRefreshToken,
} from "../config/jwt.js";

function createTokenPayload(userId) {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new TypeError("userId must be a non-empty string.");
  }

  return { sub: userId.trim() };
}

export function generateAccessToken(userId) {
  return signAccessToken(createTokenPayload(userId));
}

export function generateRefreshToken(userId) {
  return signRefreshToken(createTokenPayload(userId));
}

export function generateToken(userId, type = "access") {
  if (type === "access") {
    return generateAccessToken(userId);
  }
  if (type === "refresh") {
    return generateRefreshToken(userId);
  }

  throw new RangeError('type must be either "access" or "refresh".');
}

export default generateToken;