import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, getPlayerInsights } = vi.hoisted(() => ({
  prisma: {
    battleParticipant: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
  getPlayerInsights: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({ prisma }));
vi.mock("../src/services/playerInsightsService.js", () => ({ getPlayerInsights }));

import { getMyInsights, getMyStats } from "../src/controllers/userController.js";

function mockResponse() {
  return {
    body: undefined,
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("user insights controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the ML insights response for the authenticated user", async () => {
    const insights = {
      attempts: 5,
      ready: true,
      overallAccuracy: 0.8,
      difficulty: { EASY: { attempts: 2, accuracy: 1, avgSolveTimeSec: 60 } },
      topics: { Arrays: { attempts: 3, accuracy: 1, smoothedAccuracy: 0.9 } },
      strongestTopic: null,
      weakestTopic: null,
      messages: [],
    };
    getPlayerInsights.mockResolvedValue(insights);
    const res = mockResponse();

    await getMyInsights({ user: { id: "user-1" } }, res);

    expect(getPlayerInsights).toHaveBeenCalledWith("user-1");
    expect(res.body).toEqual({ success: true, insights });
  });

  it("keeps basic stats independent from the ML insights service", async () => {
    prisma.battleParticipant.findMany.mockResolvedValue([]);
    prisma.user.findUnique.mockResolvedValue({ bestRating: 1500, rating: 1500 });
    const res = mockResponse();

    await getMyStats({ user: { id: "user-1" } }, res);

    expect(getPlayerInsights).not.toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalBattles).toBe(0);
  });
});
