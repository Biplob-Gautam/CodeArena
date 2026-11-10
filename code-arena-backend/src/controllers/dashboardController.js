import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

export async function getDashboard(req, res) {
  const [user, participants] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        rating: true,
        ratingDeviation: true,
        bestRating: true,
      },
    }),
    prisma.battleParticipant.findMany({
      where: { userId: req.user.id, battle: { status: "COMPLETED" } },
      orderBy: { battle: { endsAt: "desc" } },
      take: 10,
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

  if (!user) throw new ApiError(404, "User not found.");

  const [totalBattles, wins, losses] = await Promise.all([
    prisma.battleParticipant.count({
      where: { userId: req.user.id, battle: { status: "COMPLETED" } },
    }),
    prisma.battleParticipant.count({
      where: {
        userId: req.user.id,
        result: "WIN",
        battle: { status: "COMPLETED" },
      },
    }),
    prisma.battleParticipant.count({
      where: {
        userId: req.user.id,
        result: "LOSS",
        battle: { status: "COMPLETED" },
      },
    }),
  ]);

  const recentBattles = participants.map(({ battle, ...participant }) => ({
    id: battle.id,
    status: battle.status,
    result: participant.result,
    ratingChange: participant.ratingChange,
    endedAt: battle.endsAt,
    problem: battle.problem,
    opponent: battle.participants[0]?.user ?? null,
  }));

  return res.json({
    success: true,
    dashboard: {
      user,
      stats: {
        totalBattles,
        wins,
        losses,
        draws: totalBattles - wins - losses,
        winRate: totalBattles
          ? Number(((wins / totalBattles) * 100).toFixed(1))
          : 0,
      },
      recentBattles,
    },
  });
}

export default { getDashboard };