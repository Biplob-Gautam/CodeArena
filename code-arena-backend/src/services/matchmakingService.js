import { randomInt } from "node:crypto";
import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

const matchmakingLockId = 817263;

const matchmakingBattleInclude = {
  problem: { select: { id: true, slug: true, title: true, difficulty: true } },
  participants: {
    include: {
      user: {
        select: { id: true, username: true, displayName: true, rating: true, ratingDeviation: true },
      },
    },
  },
};

export async function findMatch(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, rating: true, ratingDeviation: true, isActive: true },
  });
  if (!user || !user.isActive) throw new ApiError(401, "User account is unavailable.");

  try {
    return await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(${matchmakingLockId})`;

        const existing = await tx.battleParticipant.findFirst({
          where: {
            userId,
            battle: { status: { in: ["WAITING", "IN_PROGRESS"] } },
          },
          include: { battle: { include: matchmakingBattleInclude } },
        });
        if (existing) {
          return {
            status: existing.battle.status === "IN_PROGRESS" ? "MATCHED" : "WAITING",
            battle: existing.battle,
          };
        }

        const candidates = await tx.battle.findMany({
          where: {
            status: "WAITING",
            participants: { none: { userId } },
          },
          include: { participants: { include: { user: { select: { rating: true } } } } },
          orderBy: { createdAt: "asc" },
          take: 100,
        });
        const candidate = candidates
          .filter(
            (battle) =>
              battle.participants.length === 1 &&
              Math.abs(battle.participants[0].user.rating - user.rating) <=
                100 +
                  Math.min(
                    1000,
                    Math.floor((Date.now() - battle.createdAt.getTime()) / 60_000) * 25,
                  ) +
                  Math.min(150, Math.round(user.ratingDeviation * 0.25)),
          )
          .reduce((closest, battle) => {
            if (!closest) return battle;
            const gap = Math.abs(battle.participants[0].user.rating - user.rating);
            const closestGap = Math.abs(closest.participants[0].user.rating - user.rating);
            return gap < closestGap ? battle : closest;
          }, null);

        if (candidate) {
          await tx.battleParticipant.create({ data: { battleId: candidate.id, userId } });
          const battle = await tx.battle.update({
            where: { id: candidate.id },
            data: { status: "IN_PROGRESS", startsAt: new Date() },
            include: matchmakingBattleInclude,
          });
          return { status: "MATCHED", battle };
        }

        const problems = await tx.problem.findMany({
          where: { isPublished: true },
          select: { id: true, battleDurationSeconds: true },
        });
        if (!problems.length) {
          throw new ApiError(503, "No published problems are available for matchmaking.");
        }
        const problem = problems[randomInt(problems.length)];
        const battle = await tx.battle.create({
          data: {
            problemId: problem.id,
            durationSeconds: problem.battleDurationSeconds,
            participants: { create: { userId } },
          },
          include: matchmakingBattleInclude,
        });
        return { status: "WAITING", battle };
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (error?.code === "P2034") {
      throw new ApiError(409, "Matchmaking is busy. Please retry.");
    }
    throw error;
  }
}

export async function cancelMatch(userId) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${matchmakingLockId})`;
    const participant = await tx.battleParticipant.findFirst({
      where: { userId, battle: { status: "WAITING" } },
      include: { battle: { include: { participants: true } } },
    });

    if (!participant) {
      const isInBattle = await tx.battleParticipant.findFirst({
        where: { userId, battle: { status: "IN_PROGRESS" } },
        select: { id: true },
      });
      if (isInBattle) {
        throw new ApiError(409, "A match cannot be cancelled after the battle starts.");
      }
      return false;
    }

    await tx.battleParticipant.delete({ where: { id: participant.id } });
    if (participant.battle.participants.length === 1) {
      await tx.battle.delete({ where: { id: participant.battleId } });
    }
    return true;
  });
}

export default { findMatch, cancelMatch };