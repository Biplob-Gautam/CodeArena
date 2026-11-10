import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../src/config/database.js", () => ({ prisma }));

import { getLeaderboard } from "../src/services/leaderboardService.js";

describe("leaderboard service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts completed battles only", async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "coder",
        displayName: "Coder",
        avatarUrl: null,
        rating: 1600,
        ratingDeviation: 80,
        bestRating: 1650,
        _count: { battleParticipants: 3 },
      },
    ]);

    const result = await getLeaderboard();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: {
            select: {
              battleParticipants: {
                where: { battle: { status: "COMPLETED" } },
              },
            },
          },
        }),
      }),
    );
    expect(result.entries[0].totalBattles).toBe(3);
  });
});
