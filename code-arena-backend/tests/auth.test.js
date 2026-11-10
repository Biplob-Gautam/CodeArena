import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("../src/config/database.js", () => ({ prisma }));
vi.mock("../src/utils/generateToken.js", () => ({
  generateAccessToken: vi.fn(() => "mock-token"),
}));

import { login, register } from "../src/controllers/authController.js";

function mockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("auth controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a user and returns a token", async () => {
    prisma.user.create.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice",
      avatarUrl: null,
      bio: null,
      rating: 1500,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });

    const req = {
      body: {
        email: "alice@example.com",
        username: "alice",
        password: "secret123",
      },
    };
    const res = mockResponse();

    await register(req, res);

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe("mock-token");
    expect(res.body.user.username).toBe("alice");
  });

  it("logs in an existing user with a valid password", async () => {
    const passwordHash = await bcrypt.hash("secret123", 12);
    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice",
      avatarUrl: null,
      bio: null,
      rating: 1500,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      passwordHash,
      isActive: true,
    });

    const req = {
      body: {
        email: "alice@example.com",
        password: "secret123",
      },
    };
    const res = mockResponse();

    await login(req, res);

    expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe("mock-token");
    expect(res.body.user.email).toBe("alice@example.com");
  });
});
