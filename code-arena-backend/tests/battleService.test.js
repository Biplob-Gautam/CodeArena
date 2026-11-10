import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, applyBattleRating } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
  },
  applyBattleRating: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({ prisma }));
vi.mock("../src/services/ratingService.js", () => ({ applyBattleRating }));

import { completeBattle } from "../src/services/battleService.js";

function createTransaction(battle) {
  let queryCount = 0;
  const acceptedRows = battle.participants
    .flatMap((participant) =>
      participant.submissions
        .filter((submission) => submission.status === "ACCEPTED")
        .map((submission) => ({
          participantId: participant.id,
          submittedAt: submission.submittedAt,
          submissionOrder: submission.submissionOrder,
        })),
    )
    .sort((left, right) => left.submissionOrder - right.submissionOrder);
  const tx = {
    $queryRaw: vi.fn().mockImplementation(() => {
      queryCount += 1;
      return Promise.resolve(queryCount === 1 ? [] : acceptedRows);
    }),
    battle: {
      findUnique: vi.fn().mockResolvedValue(battle),
      update: vi.fn().mockResolvedValue({}),
    },
    battleParticipant: {
      update: vi.fn().mockResolvedValue({}),
    },
  };
  prisma.$transaction.mockImplementation((callback) => callback(tx));
  return tx;
}

describe("battle completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applyBattleRating.mockResolvedValue([]);
  });

  it("uses the earliest accepted submission time and ends at the scheduled deadline", async () => {
    const startsAt = new Date(Date.now() - 10 * 60_000);
    const firstSubmitted = new Date(startsAt.getTime() + 120_000);
    const secondSubmitted = new Date(startsAt.getTime() + 60_000);
    const battle = {
      id: "battle-1",
      status: "IN_PROGRESS",
      startsAt,
      durationSeconds: 300,
      participants: [
        {
          id: "participant-1",
          acceptedAt: null,
          submissions: [{
            status: "ACCEPTED",
            submittedAt: firstSubmitted,
            submissionOrder: 1,
          }],
        },
        {
          id: "participant-2",
          acceptedAt: null,
          submissions: [{
            status: "ACCEPTED",
            submittedAt: secondSubmitted,
            submissionOrder: 2,
          }],
        },
      ],
    };
    const tx = createTransaction(battle);

    const result = await completeBattle("battle-1");

    expect(result).toMatchObject({
      battleId: "battle-1",
      status: "COMPLETED",
      completedNow: true,
    });
    expect(tx.battleParticipant.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: { result: "WIN", acceptedAt: firstSubmitted },
      }),
    );
    expect(tx.battleParticipant.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: { result: "LOSS", acceptedAt: secondSubmitted },
      }),
    );
    expect(tx.battle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "COMPLETED",
          endsAt: new Date(startsAt.getTime() + 300_000),
        },
      }),
    );
    expect(applyBattleRating).toHaveBeenCalledWith("battle-1");
  });

  it("does not finalize a battle while a pre-deadline submission is still being judged", async () => {
    const startsAt = new Date(Date.now() - 10 * 60_000);
    const tx = createTransaction({
      id: "battle-2",
      status: "IN_PROGRESS",
      startsAt,
      durationSeconds: 300,
      participants: [
        {
          id: "participant-1",
          acceptedAt: null,
          submissions: [{ status: "PROCESSING", submittedAt: startsAt }],
        },
        { id: "participant-2", acceptedAt: null, submissions: [] },
      ],
    });

    await expect(completeBattle("battle-2")).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(tx.battle.update).not.toHaveBeenCalled();
    expect(applyBattleRating).not.toHaveBeenCalled();
  });

  it("records a draw when neither participant has an accepted submission", async () => {
    const startsAt = new Date(Date.now() - 10 * 60_000);
    const tx = createTransaction({
      id: "battle-3",
      status: "IN_PROGRESS",
      startsAt,
      durationSeconds: 300,
      participants: [
        { id: "participant-1", acceptedAt: null, submissions: [] },
        { id: "participant-2", acceptedAt: null, submissions: [] },
      ],
    });

    await completeBattle("battle-3");

    expect(tx.battleParticipant.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: { result: "DRAW", acceptedAt: null } }),
    );
    expect(tx.battleParticipant.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: { result: "DRAW", acceptedAt: null } }),
    );
  });
});
