import "dotenv/config";
import jwt from "jsonwebtoken";

function getSecret(name) {
  const secret = process.env[name];

  if (!secret) {
    throw new Error(`${name} is not set. Add it to the backend .env file.`);
  }

  if (secret.length < 32 || /^(replace|generate)-/i.test(secret)) {
    throw new Error(`${name} must be a unique secret of at least 32 characters.`);
  }

  return secret;
}

const accessSecret = getSecret("JWT_ACCESS_SECRET");
const refreshSecret = getSecret("JWT_REFRESH_SECRET");

if (accessSecret === refreshSecret) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.");
}

export const jwtConfig = Object.freeze({
  accessSecret,
  refreshSecret,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
});

export function signAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
    issuer: "code-arena",
    audience: "code-arena-api",
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret, {
    issuer: "code-arena",
    audience: "code-arena-api",
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    issuer: "code-arena",
    audience: "code-arena-api",
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret, {
    issuer: "code-arena",
    audience: "code-arena-api",
  });
}