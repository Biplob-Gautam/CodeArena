import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("../src/config/database.js", () => ({ prisma }));

import { cancelMatch, findMatch } from "../src/controllers/matchmakingController.js";

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

describe("matchmaking controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a waiting response when no opponent is available yet", async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: vi.fn(),
        battleParticipant: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        battle: {
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({
            id: "battle-1",
            status: "WAITING",
            problem: { id: "problem-1", title: "Two Sum", difficulty: "EASY" },
            participants: [{ user: { id: "user-1", username: "alice", rating: 1500 } }],
          }),
        },
        problem: {
          findMany: vi.fn().mockResolvedValue([
            { id: "problem-1", battleDurationSeconds: 900 },
          ]),
        },
      }),
    );

    const req = { user: { id: "user-1", rating: 1500 } };
    const res = mockResponse();

    await findMatch(req, res);

    expect(res.statusCode).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("WAITING");
  });

  it("returns a cancellation response when no pending request exists", async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: vi.fn(),
        battleParticipant: {
          findFirst: vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null),
        },
        battle: { delete: vi.fn() },
      }),
    );

    const req = { user: { id: "user-1" } };
    const res = mockResponse();

    await cancelMatch(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.cancelled).toBe(false);
  });
});
