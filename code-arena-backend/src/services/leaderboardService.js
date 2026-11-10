import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

export async function getLeaderboard({ page = 1, limit = 50 } = {}) {
  const safePage = Number.parseInt(page, 10) || 1;
  const parsedLimit = Number.parseInt(limit, 10) || 50;
  if (safePage < 1 || parsedLimit < 1) {
    throw new ApiError(400, "page and limit must be positive integers.");
  }
  const safeLimit = Math.min(parsedLimit, 100);
  const where = { isActive: true };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ rating: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        rating: true,
        ratingDeviation: true,
        bestRating: true,
        _count: {
          select: {
            battleParticipants: { where: { battle: { status: "COMPLETED" } } },
          },
        },
      },
    }),
  ]);

  return {
    entries: users.map((user, index) => ({
      rank: (safePage - 1) * safeLimit + index + 1,
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      rating: user.rating,
      ratingDeviation: user.ratingDeviation,
      bestRating: user.bestRating,
      totalBattles: user._count.battleParticipants,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

export default { getLeaderboard };