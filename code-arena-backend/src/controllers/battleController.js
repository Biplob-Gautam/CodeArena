import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

const battleInclude = {
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
        select: { id: true, username: true, displayName: true, avatarUrl: true, rating: true },
      },
    },
  },
};

export async function getBattle(req, res) {
  const battle = await prisma.battle.findUnique({
    where: { id: req.params.battleId },
    include: battleInclude,
  });
  if (!battle) throw new ApiError(404, "Battle not found.");

  const isParticipant = battle.participants.some(
    (participant) => participant.userId === req.user.id,
  );
  if (!isParticipant && req.user.role !== "ADMIN") {
    throw new ApiError(403, "You are not a participant in this battle.");
  }

  return res.json({ success: true, battle });
}

export async function getBattleHistory(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const where = {
    userId: req.user.id,
    battle: { status: "COMPLETED" },
  };

  const [total, participants] = await Promise.all([
    prisma.battleParticipant.count({ where }),
    prisma.battleParticipant.findMany({
      where,
      orderBy: { battle: { endsAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        battle: {
          include: {
            problem: { select: { id: true, title: true, difficulty: true } },
            participants: {
              where: { userId: { not: req.user.id } },
              include: {
                user: { select: { id: true, username: true, rating: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const battles = participants.map(({ battle, ...participant }) => ({
    ...battle,
    myResult: participant.result,
    ratingChange: participant.ratingChange,
    opponent: battle.participants[0]?.user ?? null,
  }));

  return res.json({
    success: true,
    battles,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export default { getBattle, getBattleHistory };