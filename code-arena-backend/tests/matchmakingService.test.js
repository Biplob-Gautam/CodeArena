import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, selectProblem } = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    problem: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
  selectProblem: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({ prisma }));
vi.mock("../src/ml/mlService.js", () => ({ selectProblem }));

import { findMatch } from "../src/services/matchmakingService.js";

function setupMatch({
  recommendation = { problem: { problemId: "ml-problem" } },
  publishedRecommendation = { id: "ml-problem", battleDurationSeconds: 1200 },
} = {}) {
  const user = {
    id: "user-2",
    rating: 1510,
    ratingDeviation: 100,
    isActive: true,
  };
  const waitingBattle = {
    id: "battle-1",
    status: "WAITING",
    createdAt: new Date(),
    problemId: "random-problem",
    durationSeconds: 900,
    participants: [{ user: { id: "user-1", rating: 1500 } }],
  };
  let persistedProblemId = waitingBattle.problemId;
  let persistedDurationSeconds = waitingBattle.durationSeconds;
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    battleParticipant: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    battle: {
      findMany: vi.fn().mockResolvedValue([waitingBattle]),
      findUnique: vi.fn().mockResolvedValue(waitingBattle),
      update: vi.fn().mockImplementation(({ data }) => {
        if (data.problemId) {
          persistedProblemId = data.problemId;
          persistedDurationSeconds = data.durationSeconds;
          return Promise.resolve({});
        }
        return Promise.resolve({
          id: waitingBattle.id,
          status: data.status,
          startsAt: data.startsAt,
          problemId: persistedProblemId,
          durationSeconds: persistedDurationSeconds,
          problem: { id: persistedProblemId, title: "Selected problem", difficulty: "EASY" },
          participants: [],
        });
      }),
    },
    problem: { findFirst: vi.fn().mockResolvedValue(publishedRecommendation) },
  };
  prisma.user.findUnique.mockResolvedValue(user);
  prisma.problem.count.mockResolvedValue(5);
  prisma.problem.findMany.mockResolvedValue([
    { id: "ml-binary", difficulty: "EASY", tags: ["array", "binary-search"] },
    { id: "ml-max", difficulty: "MEDIUM", tags: ["array", "dynamic-programming"] },
    { id: "ml-problem", difficulty: "EASY", tags: ["array", "hash-table"] },
    { id: "ml-valid", difficulty: "EASY", tags: ["string", "stack"] },
    { id: "unknown-topic-problem", difficulty: "MEDIUM", tags: ["unmapped-tag"] },
  ]);
  prisma.$transaction.mockImplementation(async (callback) => callback(tx));
  selectProblem.mockResolvedValue(recommendation);

  return { tx, user, waitingBattle };
}

describe("ML-assisted matchmaking problem selection", () => {
  let warn;

  beforeEach(() => {
    vi.clearAllMocks();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("persists a valid ML recommendation before starting the battle timer", async () => {
    const { tx } = setupMatch();

    const result = await findMatch("user-2");

    expect(selectProblem).toHaveBeenCalledWith({
      playerA: { rating: 1510 },
      playerB: { rating: 1500 },
      candidates: [
        {
          problemId: "ml-binary",
          difficulty: "EASY",
          topic: "Binary Search",
          acceptanceRate: 0.5,
        },
        {
          problemId: "ml-max",
          difficulty: "MEDIUM",
          topic: "Dynamic Programming",
          acceptanceRate: 0.5,
        },
        {
          problemId: "ml-problem",
          difficulty: "EASY",
          topic: "Hashing",
          acceptanceRate: 0.5,
        },
        {
          problemId: "ml-valid",
          difficulty: "EASY",
          topic: "Stack",
          acceptanceRate: 0.5,
        },
      ],
    });
    expect(prisma.problem.count).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        tags: {
          hasSome: [
            "array",
            "hash-table",
            "string",
            "stack",
            "binary-search",
            "dynamic-programming",
          ],
        },
      },
    });
    expect(prisma.problem.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        tags: {
          hasSome: [
            "array",
            "hash-table",
            "string",
            "stack",
            "binary-search",
            "dynamic-programming",
          ],
        },
      },
      select: { id: true, difficulty: true, tags: true },
      orderBy: { id: "asc" },
      skip: 0,
      take: 5,
    });
    expect(tx.battle.update).toHaveBeenNthCalledWith(1, {
      where: { id: "battle-1" },
      data: { problemId: "ml-problem", durationSeconds: 1200 },
    });
    expect(tx.battle.update).toHaveBeenNthCalledWith(2, {
      where: { id: "battle-1" },
      data: {
        status: "IN_PROGRESS",
        startsAt: expect.any(Date),
      },
      include: expect.any(Object),
    });
    expect(tx.battle.update.mock.invocationCallOrder[0]).toBeLessThan(
      tx.battle.update.mock.invocationCallOrder[1],
    );
    expect(tx.battleParticipant.create.mock.invocationCallOrder[0]).toBeLessThan(
      tx.battle.update.mock.invocationCallOrder[1],
    );
    expect(result).toMatchObject({
      status: "MATCHED",
      battle: { problemId: "ml-problem" },
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("uses the ML-selected problem's duration instead of the random problem's duration", async () => {
    const { tx, waitingBattle } = setupMatch({
      publishedRecommendation: {
        id: "ml-problem",
        battleDurationSeconds: 1200,
      },
    });

    const result = await findMatch("user-2");

    expect(waitingBattle.durationSeconds).toBe(900);
    expect(tx.problem.findFirst).toHaveBeenCalledWith({
      where: { id: "ml-problem", isPublished: true },
      select: { id: true, battleDurationSeconds: true },
    });
    expect(tx.battle.update).toHaveBeenNthCalledWith(1, {
      where: { id: "battle-1" },
      data: { problemId: "ml-problem", durationSeconds: 1200 },
    });
    expect(result.battle).toMatchObject({
      problemId: "ml-problem",
      durationSeconds: 1200,
    });
  });

  it("retains the assigned random problem when ML is unavailable", async () => {
    const { tx } = setupMatch();
    const unavailable = new Error("ML request timed out");
    selectProblem.mockImplementation(async () => {
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      throw unavailable;
    });

    const result = await findMatch("user-2");

    expect(tx.battle.update).toHaveBeenCalledTimes(1);
    expect(tx.battle.update).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        status: "IN_PROGRESS",
        startsAt: expect.any(Date),
      },
    }));
    expect(result.battle.problemId).toBe("random-problem");
    expect(result.battle.durationSeconds).toBe(900);
    expect(warn).toHaveBeenCalledWith(
      "ML problem selection failed; retaining the assigned problem.",
      unavailable,
    );
  });

  it("retains the assigned problem when ML returns an ID outside the shortlist", async () => {
    const { tx } = setupMatch({
      recommendation: { problem: { problemId: "not-in-shortlist" } },
    });

    const result = await findMatch("user-2");

    expect(tx.problem.findFirst).not.toHaveBeenCalled();
    expect(tx.battle.update).toHaveBeenCalledTimes(1);
    expect(result.battle.problemId).toBe("random-problem");
    expect(warn).toHaveBeenCalled();
  });

  it("retains the assigned problem when ML returns no problem", async () => {
    const { tx } = setupMatch({ recommendation: { problem: null } });

    const result = await findMatch("user-2");

    expect(tx.problem.findFirst).not.toHaveBeenCalled();
    expect(tx.battle.update).toHaveBeenCalledTimes(1);
    expect(result.battle.problemId).toBe("random-problem");
    expect(warn).toHaveBeenCalled();
  });

  it("retains the assigned problem when ML recommends a problem no longer published", async () => {
    const { tx } = setupMatch({ publishedRecommendation: null });

    const result = await findMatch("user-2");

    expect(tx.problem.findFirst).toHaveBeenCalledWith({
      where: { id: "ml-problem", isPublished: true },
      select: { id: true, battleDurationSeconds: true },
    });
    expect(tx.battle.update).toHaveBeenCalledTimes(1);
    expect(result.battle.problemId).toBe("random-problem");
    expect(result.battle.durationSeconds).toBe(900);
    expect(result.battle.durationSeconds).toBe(900);
    expect(warn).toHaveBeenCalledWith(
      "ML problem selection returned an unpublished problem; retaining the assigned problem.",
    );
  });

  it("uses a uniformly rotated, bounded shortlist across all eligible problems", async () => {
    const { tx } = setupMatch();
    const problems = Array.from({ length: 40 }, (_, index) => ({
      id: `problem-${String(index).padStart(3, "0")}`,
      difficulty: index % 2 ? "MEDIUM" : "EASY",
      tags: ["array"],
    }));
    prisma.problem.count.mockResolvedValue(problems.length);
    prisma.problem.findMany.mockImplementation(async ({ skip, take }) =>
      problems.slice(skip, skip + take),
    );
    selectProblem.mockImplementation(async ({ candidates }) => ({
      problem: { problemId: candidates[0].problemId },
    }));
    tx.problem.findFirst.mockImplementation(async ({ where }) => ({
      id: where.id,
    }));

    await findMatch("user-2");

    const [firstQuery, secondQuery] = prisma.problem.findMany.mock.calls;
    const startOffset = firstQuery[0].skip;
    expect(startOffset).toBeGreaterThanOrEqual(0);
    expect(startOffset).toBeLessThan(problems.length);
    expect(firstQuery[0]).toMatchObject({
      where: {
        isPublished: true,
        tags: { hasSome: expect.any(Array) },
      },
      orderBy: { id: "asc" },
      take: 30,
    });
    const recommendedCandidates = selectProblem.mock.calls[0][0].candidates;
    expect(recommendedCandidates).toHaveLength(30);
    expect(new Set(recommendedCandidates.map(({ problemId }) => problemId)).size).toBe(30);
    if (startOffset + 30 > problems.length) {
      expect(secondQuery[0]).toMatchObject({
        skip: 0,
        take: startOffset + 30 - problems.length,
      });
    } else {
      expect(secondQuery).toBeUndefined();
    }
  });

  it("retries bounded Prisma serialization conflicts before matchmaking", async () => {
    const { tx } = setupMatch();
    prisma.$transaction
      .mockRejectedValueOnce({ code: "P2034" })
      .mockImplementation(async (callback) => callback(tx));

    const result = await findMatch("user-2");

    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({
      status: "MATCHED",
      battle: { problemId: "ml-problem" },
    });
  });
});
