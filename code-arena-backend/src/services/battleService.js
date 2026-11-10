import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { applyBattleRating } from "./ratingService.js";

const battleDetails = {
  problem: {
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      description: true,
      inputFormat: true,
      outputFormat: true,
      constraints: true,
      examples: true,
      timeLimitMs: true,
      memoryLimitMb: true,
    },
  },
  participants: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          rating: true,
          ratingDeviation: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  },
};

export async function getBattleById(battleId, userId, role = "USER") {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: battleDetails,
  });
  if (!battle) throw new ApiError(404, "Battle not found.");
  if (role !== "ADMIN" && !battle.participants.some((p) => p.userId === userId)) {
    throw new ApiError(403, "You are not a participant in this battle.");
  }
  return battle;
}

export async function getUserBattleHistory(userId, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const where = { userId, battle: { status: "COMPLETED" } };
  const [total, participants] = await Promise.all([
    prisma.battleParticipant.count({ where }),
    prisma.battleParticipant.findMany({
      where,
      orderBy: { battle: { endsAt: "desc" } },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: {
        battle: {
          include: {
            problem: { select: { id: true, title: true, difficulty: true } },
            participants: {
              where: { userId: { not: userId } },
              include: {
                user: { select: { id: true, username: true, rating: true } },
              },
            },
          },
        },
      },
    }),
  ]);
  return {
    battles: participants.map(({ battle, ...participant }) => ({
      ...battle,
      myResult: participant.result,
      ratingChange: participant.ratingChange,
      opponent: battle.participants[0]?.user ?? null,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getBattleResult(battleId, userId, role = "USER") {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      problem: { select: { id: true, title: true, difficulty: true } },
      participants: {
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!battle) throw new ApiError(404, "Battle not found.");
  if (role !== "ADMIN" && !battle.participants.some((p) => p.userId === userId)) {
    throw new ApiError(403, "You are not a participant in this battle.");
  }

  return {
    battleId: battle.id,
    status: battle.status,
    startsAt: battle.startsAt,
    endsAt: battle.endsAt,
    durationSeconds: battle.durationSeconds,
    problem: battle.problem,
    players: battle.participants.map((p) => ({
      user: p.user,
      result: p.result,
      acceptedAt: p.acceptedAt,
      totalSubmissions: p.totalSubmissions,
      passedTestCases: p.passedTestCases,
      ratingBefore: p.ratingBefore,
      ratingAfter: p.ratingAfter,
      ratingChange: p.ratingChange,
    })),
  };
}

export async function completeBattle(battleId, { force = false } = {}) {
  const completedNow = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Battle" WHERE id = ${battleId} FOR UPDATE`;
    const battle = await tx.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: {
          include: {
            submissions: {
              where: { status: { in: ["ACCEPTED", "QUEUED", "PROCESSING"] } },
              select: { status: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });
    if (!battle) throw new ApiError(404, "Battle not found.");
    if (battle.status === "COMPLETED") return false;
    if (battle.status !== "IN_PROGRESS") {
      throw new ApiError(409, "Only active battles can be completed.");
    }

    const deadline = battle.startsAt
      ? battle.startsAt.getTime() + battle.durationSeconds * 1000
      : 0;
    if (!force && deadline > Date.now()) {
      throw new ApiError(409, "The battle timer has not expired.");
    }
    if (battle.participants.length !== 2) {
      throw new ApiError(409, "An active battle must have exactly two participants.");
    }

    if (
      battle.participants.some((participant) =>
        participant.submissions.some((submission) =>
          ["QUEUED", "PROCESSING"].includes(submission.status),
        ),
      )
    ) {
      throw new ApiError(
        409,
        "Battle completion is waiting for submitted solutions to finish judging.",
      );
    }

    const acceptedRows = await tx.$queryRaw`
      SELECT "participantId", "submittedAt", "submissionOrder"
      FROM "Submission"
      WHERE "status" = 'ACCEPTED'
        AND "participantId" IN (
          SELECT "id" FROM "BattleParticipant" WHERE "battleId" = ${battleId}
        )
      ORDER BY "submissionOrder" ASC
    `;
    const acceptedByParticipant = new Map();
    for (const submission of acceptedRows) {
      if (!acceptedByParticipant.has(submission.participantId)) {
        acceptedByParticipant.set(submission.participantId, submission);
      }
    }
    const acceptedSubmission = battle.participants.map(
      (participant) => acceptedByParticipant.get(participant.id) ?? null,
    );
    const acceptedAt = acceptedSubmission.map(
      (submission, index) =>
        submission?.submittedAt ?? battle.participants[index].acceptedAt ?? null,
    );
    let results = ["DRAW", "DRAW"];
    if (acceptedAt[0] && !acceptedAt[1]) results = ["WIN", "LOSS"];
    else if (!acceptedAt[0] && acceptedAt[1]) results = ["LOSS", "WIN"];
    else if (acceptedAt[0] && acceptedAt[1]) {
      const winnerIndex =
        acceptedSubmission[0] && acceptedSubmission[1]
          ? acceptedSubmission[0].submissionOrder <=
            acceptedSubmission[1].submissionOrder
            ? 0
            : 1
          : acceptedAt[0].getTime() <= acceptedAt[1].getTime()
            ? 0
            : 1;
      results = winnerIndex === 0 ? ["WIN", "LOSS"] : ["LOSS", "WIN"];
    }

    for (const [index, participant] of battle.participants.entries()) {
      await tx.battleParticipant.update({
        where: { id: participant.id },
        data: { result: results[index], acceptedAt: acceptedAt[index] },
      });
    }
    await tx.battle.update({
      where: { id: battleId },
      data: {
        status: "COMPLETED",
        endsAt: force ? new Date() : new Date(deadline),
      },
    });
    return true;
  });

  const ratings = await applyBattleRating(battleId);
  return { battleId, status: "COMPLETED", completedNow, ratings };
}

export default {
  getBattleById,
  getUserBattleHistory,
  getBattleResult,
  completeBattle,
};