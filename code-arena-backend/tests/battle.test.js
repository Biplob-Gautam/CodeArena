import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    battle: {
      findUnique: vi.fn(),
    },
    battleParticipant: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../src/config/database.js", () => ({ prisma }));

import { getBattle, getBattleHistory } from "../src/controllers/battleController.js";

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

describe("battle controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the battle history for the authenticated user", async () => {
    prisma.battleParticipant.count.mockResolvedValue(1);
    prisma.battleParticipant.findMany.mockResolvedValue([
      {
        result: "WIN",
        ratingChange: 16,
        battle: {
          id: "battle-1",
          status: "COMPLETED",
          endsAt: new Date("2024-01-01T00:00:00Z"),
          problem: { id: "p-1", title: "Two Sum", difficulty: "EASY" },
          participants: [
            {
              user: {
                id: "user-2",
                username: "bob",
                rating: 1800,
              },
            },
          ],
        },
      },
    ]);

    const req = {
      user: { id: "user-1", role: "USER" },
      query: { page: "1", limit: "10" },
    };
    const res = mockResponse();

    await getBattleHistory(req, res);

    expect(prisma.battleParticipant.count).toHaveBeenCalledTimes(1);
    expect(res.body.success).toBe(true);
    expect(res.body.battles[0].opponent.username).toBe("bob");
    expect(res.body.battles[0].myResult).toBe("WIN");
  });

  it("rejects access when the requester is not a battle participant", async () => {
    prisma.battle.findUnique.mockResolvedValue({
      id: "battle-2",
      participants: [{ userId: "user-2" }],
    });

    const req = {
      user: { id: "user-1", role: "USER" },
      params: { battleId: "battle-2" },
    };

    await expect(getBattle(req, {})).rejects.toMatchObject({ statusCode: 403 });
  });
});
