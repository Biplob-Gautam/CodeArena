import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, getInsights } = vi.hoisted(() => ({
  prisma: {
    battleParticipant: { findMany: vi.fn() },
  },
  getInsights: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({ prisma }));
vi.mock("../src/ml/mlService.js", () => ({ getInsights }));

import {
  buildInsightsPayload,
  getPlayerInsights,
} from "../src/services/playerInsightsService.js";
import { getMlTopic } from "../src/services/matchmakingService.js";
import { problems } from "../scripts/seedProblems.js";

function participant({
  battleId,
  startsAt,
  result = "WIN",
  status = "COMPLETED",
  tags = ["array", "hash-table"],
  difficulty = "EASY",
  submissions = [],
  ratingAfter,
}) {
  return {
    result,
    submissions,
    battle: {
      id: battleId,
      status,
      startsAt: new Date(startsAt),
      endsAt: new Date(new Date(startsAt).getTime() + 15 * 60 * 1000),
      createdAt: new Date(startsAt),
      problem: { title: `Problem ${battleId}`, difficulty, tags },
      ratingHistories:
        ratingAfter === undefined ? [] : [{ ratingAfter }],
    },
  };
}

describe("player insights service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds chronological single-attempt rows with earliest accepted solve times", () => {
    const history = [
      participant({
        battleId: "later",
        startsAt: "2026-01-02T00:00:00Z",
        result: "LOSS",
        difficulty: "HARD",
        submissions: [
          { status: "ACCEPTED", submittedAt: new Date("2026-01-02T00:02:00Z") },
          { status: "ACCEPTED", submittedAt: new Date("2026-01-02T00:01:30Z") },
        ],
        ratingAfter: 1490,
      }),
      participant({
        battleId: "earlier",
        startsAt: "2026-01-01T00:00:00Z",
        submissions: [
          { status: "WRONG_ANSWER", submittedAt: new Date("2026-01-01T00:01:00Z") },
        ],
        ratingAfter: 1500,
      }),
      participant({
        battleId: "incomplete",
        startsAt: "2026-01-03T00:00:00Z",
        status: "IN_PROGRESS",
      }),
    ];

    expect(buildInsightsPayload(history)).toEqual({
      submissions: [
        {
          difficulty: "EASY",
          topic: "Hashing",
          accepted: false,
          solveTimeSec: null,
          matchIndex: 1,
        },
        {
          difficulty: "HARD",
          topic: "Hashing",
          accepted: true,
          solveTimeSec: 90,
          matchIndex: 2,
        },
      ],
      matches: [
        {
          matchIndex: 1,
          result: "WIN",
          ratingAfter: 1500,
          problemTitle: "Problem earlier",
        },
        {
          matchIndex: 2,
          result: "LOSS",
          ratingAfter: 1490,
          problemTitle: "Problem later",
        },
      ],
    });
  });

  it("produces empty history arrays without inventing match data", () => {
    expect(buildInsightsPayload([])).toEqual({ submissions: [], matches: [] });
  });

  it("maps every existing seeded problem tag to a supported topic", () => {
    const seededTags = new Set(problems.flatMap((problem) => problem.tags));
    const topicByTag = {
      array: "Arrays",
      "hash-table": "Hashing",
      "binary-search": "Binary Search",
      string: "Strings",
      stack: "Stack",
      "dynamic-programming": "Dynamic Programming",
    };

    expect([...seededTags]).toEqual(expect.arrayContaining(Object.keys(topicByTag)));
    for (const tag of seededTags) {
      expect(getMlTopic([tag])).toBe(topicByTag[tag]);
    }
    expect(
      problems.map((problem) => [problem.slug, getMlTopic(problem.tags)]),
    ).toEqual([
      ["two-sum", "Hashing"],
      ["binary-search", "Binary Search"],
      ["valid-parentheses", "Stack"],
      ["maximum-subarray", "Dynamic Programming"],
    ]);
  });

  it("retains unknown-topic battles without assigning them a false topic", () => {
    const payload = buildInsightsPayload([
      participant({
        battleId: "unknown-topic",
        startsAt: "2026-01-01T00:00:00Z",
        tags: ["unrecognized-tag"],
        result: "DRAW",
      }),
    ]);

    expect(payload.submissions).toEqual([
      {
        difficulty: "EASY",
        topic: null,
        accepted: false,
        solveTimeSec: null,
        matchIndex: 1,
      },
    ]);
    expect(payload.matches).toEqual([
      { matchIndex: 1, result: "DRAW", problemTitle: "Problem unknown-topic" },
    ]);
  });

  it("queries only the requested user's completed, decided battles", async () => {
    prisma.battleParticipant.findMany.mockResolvedValue([]);
    const response = {
      attempts: 0,
      ready: false,
      messages: ["No battles yet. Play your first match to start building your profile."],
    };
    getInsights.mockResolvedValue(response);

    await expect(getPlayerInsights("user-1")).resolves.toEqual(response);

    expect(prisma.battleParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          result: { in: ["WIN", "LOSS", "DRAW"] },
          battle: { status: "COMPLETED" },
        },
        select: expect.objectContaining({
          battle: expect.objectContaining({
            select: expect.objectContaining({
              ratingHistories: expect.objectContaining({
                where: { userId: "user-1", reason: "BATTLE_RESULT" },
              }),
            }),
          }),
        }),
      }),
    );
    expect(getInsights).toHaveBeenCalledWith({ submissions: [], matches: [] });
  });

  it("reports ML unavailability explicitly instead of returning fabricated insights", async () => {
    const errorSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    prisma.battleParticipant.findMany.mockResolvedValue([]);
    getInsights.mockRejectedValue(new Error("ML service unavailable"));

    await expect(getPlayerInsights("user-1")).rejects.toMatchObject({
      statusCode: 503,
      message: "Player insights are temporarily unavailable.",
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("maps an invalid successful ML response to the insights 503", async () => {
    const errorSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    prisma.battleParticipant.findMany.mockResolvedValue([]);
    getInsights.mockRejectedValue(
      new Error("Player Insights Model Error: Invalid insights response."),
    );

    await expect(getPlayerInsights("user-1")).rejects.toMatchObject({
      statusCode: 503,
      message: "Player insights are temporarily unavailable.",
    });
    expect(errorSpy).toHaveBeenCalled();
  });
});
