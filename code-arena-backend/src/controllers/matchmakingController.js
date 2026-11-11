import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import { findMatch as findMatchService } from "../services/matchmakingService.js";

const matchmakingLockId = 817263;

export async function findMatch(req, res) {
  const result = await findMatchService(req.user.id);
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