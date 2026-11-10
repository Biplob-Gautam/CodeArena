import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, completeBattle } = vi.hoisted(() => ({
  prisma: {
    battle: { findMany: vi.fn() },
  },
  completeBattle: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({ prisma }));
vi.mock("../src/services/battleService.js", () => ({ completeBattle }));

import { runBattleCompletionPass } from "../src/services/battleCompletionScheduler.js";

describe("battle completion scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notifies both participants after an expired battle completes", async () => {
    prisma.battle.findMany.mockResolvedValue([
      {
        id: "battle-1",
        status: "IN_PROGRESS",
        startsAt: new Date(Date.now() - 10 * 60_000),
        durationSeconds: 300,
        participants: [{ userId: "user-1" }, { userId: "user-2" }],
      },
    ]);
    completeBattle.mockResolvedValue({
      status: "COMPLETED",
      completedNow: true,
    });
    const emit = vi.fn();
    const io = { to: vi.fn(() => ({ emit })) };

    await runBattleCompletionPass(io);

    expect(completeBattle).toHaveBeenCalledWith("battle-1");
    expect(io.to).toHaveBeenCalledWith("user:user-1");
    expect(io.to).toHaveBeenCalledWith("user:user-2");
    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledWith("battle:completed", {
      battleId: "battle-1",
      status: "COMPLETED",
    });
  });

  it("does not finalize an expired battle while its submissions remain in judging", async () => {
    prisma.battle.findMany.mockResolvedValue([
      {
        id: "battle-2",
        status: "IN_PROGRESS",
        startsAt: new Date(Date.now() - 10 * 60_000),
        durationSeconds: 300,
        participants: [],
      },
    ]);
    completeBattle.mockRejectedValue({
      statusCode: 409,
      message: "Battle completion is waiting for submitted solutions to finish judging.",
    });
    const io = { to: vi.fn() };

    await runBattleCompletionPass(io);

    expect(completeBattle).toHaveBeenCalledWith("battle-2");
    expect(io.to).not.toHaveBeenCalled();
  });

  it("does not repeat completion notifications while recovering ratings", async () => {
    prisma.battle.findMany.mockResolvedValue([
      {
        id: "battle-3",
        status: "COMPLETED",
        startsAt: new Date(Date.now() - 10 * 60_000),
        durationSeconds: 300,
        participants: [{ userId: "user-1" }, { userId: "user-2" }],
      },
    ]);
    completeBattle.mockResolvedValue({
      status: "COMPLETED",
      completedNow: false,
    });
    const io = { to: vi.fn() };

    await runBattleCompletionPass(io);

    expect(completeBattle).toHaveBeenCalledWith("battle-3");
    expect(io.to).not.toHaveBeenCalled();
  });
});
