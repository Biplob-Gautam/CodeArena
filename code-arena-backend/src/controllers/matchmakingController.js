import { randomInt } from "node:crypto";
import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

const matchmakingLockId = 817263;

async function enterQueue(userId, userRating) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${matchmakingLockId})`;

      const current = await tx.battleParticipant.findFirst({
        where: {
          userId,
          battle: { status: { in: ["WAITING", "IN_PROGRESS"] } },
        },
        include: {
          battle: {
            include: {
              problem: { select: { id: true, title: true, difficulty: true } },
              participants: {
                include: { user: { select: { id: true, username: true, rating: true } } },
              },
            },
          },
        },
      });

      if (current) {
        return {
          status: current.battle.status === "IN_PROGRESS" ? "MATCHED" : "WAITING",
          battle: current.battle,
        };
      }

      const waitingBattles = await tx.battle.findMany({
        where: { status: "WAITING", participants: { none: { userId } } },
        include: {
          participants: {
            include: { user: { select: { id: true, username: true, rating: true } } },
          },
          problem: { select: { id: true, title: true, difficulty: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
      const opponentBattle = waitingBattles
        .filter((battle) => battle.participants.length === 1)
        .reduce((closest, battle) => {
          if (!closest) return battle;
          const currentGap = Math.abs(
            battle.participants[0].user.rating - userRating,
          );
          const closestGap = Math.abs(
            closest.participants[0].user.rating - userRating,
          );
          return currentGap < closestGap ? battle : closest;
        }, null);

      if (opponentBattle) {
        const now = new Date();
        await tx.battleParticipant.create({
          data: { battleId: opponentBattle.id, userId },
        });
        const battle = await tx.battle.update({
          where: { id: opponentBattle.id },
          data: { status: "IN_PROGRESS", startsAt: now },
          include: {
            problem: { select: { id: true, title: true, difficulty: true } },
            participants: {
              include: { user: { select: { id: true, username: true, rating: true } } },
            },
          },
        });
        return { status: "MATCHED", battle };
      }

      const problems = await tx.problem.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          difficulty: true,
          battleDurationSeconds: true,
        },
      });
      if (problems.length === 0) {
        throw new ApiError(503, "No published problems are available for matchmaking.");
      }

      const problem = problems[randomInt(problems.length)];
      const battle = await tx.battle.create({
        data: {
          problemId: problem.id,
          durationSeconds: problem.battleDurationSeconds,
          participants: { create: { userId } },
        },
        include: {
          problem: { select: { id: true, title: true, difficulty: true } },
          participants: {
            include: { user: { select: { id: true, username: true, rating: true } } },
          },
        },
      });
      return { status: "WAITING", battle };
    },
    { isolationLevel: "Serializable" },
  );
}

export async function findMatch(req, res) {
  const result = await enterQueue(req.user.id, req.user.rating);
  return res.status(result.status === "MATCHED" ? 200 : 202).json({
    success: true,
    ...result,
  });
}

export async function cancelMatch(req, res) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${matchmakingLockId})`;

    const participant = await tx.battleParticipant.findFirst({
      where: {
        userId: req.user.id,
        battle: { status: "WAITING" },
      },
      include: { battle: { include: { participants: true } } },
    });

    if (!participant) {
      const active = await tx.battleParticipant.findFirst({
        where: { userId: req.user.id, battle: { status: "IN_PROGRESS" } },
        select: { id: true },
      });
      if (active) {
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

  return res.json({
    success: true,
    cancelled: result,
    message: result ? "Matchmaking request cancelled." : "No pending match request.",
  });
}

export default { findMatch, cancelMatch };