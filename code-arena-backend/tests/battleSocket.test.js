import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    battle: { findUnique: vi.fn() },
  },
}));

vi.mock("../src/config/database.js", () => ({ prisma }));

import { joinBattleRoom } from "../src/sockets/battleSocket.js";

describe("battle room problem state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends both participants the same persisted public problem without judging data", async () => {
    const battle = {
      id: "battle-1",
      status: "IN_PROGRESS",
      problemId: "ml-selected-problem",
      problem: {
        id: "ml-selected-problem",
        slug: "two-sum",
        title: "Two Sum",
        difficulty: "EASY",
        description: "Find the pair.",
        inputFormat: "Input",
        outputFormat: "Output",
        constraints: [],
        examples: [],
        timeLimitMs: 2000,
        memoryLimitMb: 256,
      },
      participants: [
        { userId: "user-1", user: { id: "user-1", username: "alice" } },
        { userId: "user-2", user: { id: "user-2", username: "bob" } },
      ],
    };
    prisma.battle.findUnique.mockResolvedValue(battle);
    const firstSocket = {
      data: { user: { id: "user-1" } },
      join: vi.fn(),
      emit: vi.fn(),
    };
    const secondSocket = {
      data: { user: { id: "user-2" } },
      join: vi.fn(),
      emit: vi.fn(),
    };
    const io = {
      in: vi.fn(() => ({
        fetchSockets: vi.fn().mockResolvedValue([firstSocket, secondSocket]),
      })),
      to: vi.fn(() => ({ emit: vi.fn() })),
    };

    const firstBattle = await joinBattleRoom(io, firstSocket, "battle-1");
    const secondBattle = await joinBattleRoom(io, secondSocket, "battle-1");

    expect(firstSocket.emit).toHaveBeenCalledWith("battle:joined", {
      battleId: "battle-1",
      battle,
    });
    expect(secondSocket.emit).toHaveBeenCalledWith("battle:joined", {
      battleId: "battle-1",
      battle,
    });
    expect(firstBattle.problem).toEqual(secondBattle.problem);
    expect(firstBattle.problem.id).toBe("ml-selected-problem");

    const problemSelect =
      prisma.battle.findUnique.mock.calls[0][0].include.problem.select;
    expect(problemSelect).not.toHaveProperty("testCases");
    expect(problemSelect).not.toHaveProperty("expectedOutput");
    expect(problemSelect).not.toHaveProperty("input");
  });
});
