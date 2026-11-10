import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  rating: true,
  ratingDeviation: true,
  bestRating: true,
  createdAt: true,
};

export async function getMyProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      ...publicUserSelect,
      email: true,
      leetcodeUsername: true,
      leetcodeContestRating: true,
      placementMatchesPlayed: true,
      updatedAt: true,
    },
  });
  if (!user) throw new ApiError(404, "User not found.");
  return res.json({ success: true, user });
}

export async function updateMyProfile(req, res) {
  const body = req.body ?? {};
  const data = {};
  const allowedFields = ["displayName", "avatarUrl", "bio", "leetcodeUsername"];

  for (const field of allowedFields) {
    if (!(field in body)) continue;
    const value = body[field];
    if (value !== null && typeof value !== "string") {
      throw new ApiError(400, `${field} must be a string or null.`);
    }
    if (typeof value === "string" && value.length > (field === "bio" ? 500 : 120)) {
      throw new ApiError(400, `${field} is too long.`);
    }
    data[field] = typeof value === "string" ? value.trim() || null : value;
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "Provide at least one supported profile field.");
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { ...publicUserSelect, email: true, updatedAt: true },
  });
  return res.json({ success: true, user });
}

export async function getMyStats(req, res) {
  const participants = await prisma.battleParticipant.findMany({
    where: { userId: req.user.id, battle: { status: "COMPLETED" } },
    select: {
      result: true,
      joinedAt: true,
      battle: { select: { endsAt: true } },
    },
    orderBy: { battle: { endsAt: "desc" } },
  });

  const wins = participants.filter((entry) => entry.result === "WIN").length;
  const losses = participants.filter((entry) => entry.result === "LOSS").length;
  let currentWinStreak = 0;
  for (const participant of participants) {
    if (participant.result !== "WIN") break;
    currentWinStreak += 1;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { bestRating: true, rating: true },
  });
  if (!user) throw new ApiError(404, "User not found.");

  return res.json({
    success: true,
    stats: {
      totalBattles: participants.length,
      wins,
      losses,
      draws: participants.length - wins - losses,
      winRate: participants.length
        ? Number(((wins / participants.length) * 100).toFixed(1))
        : 0,
      currentWinStreak,
      rating: user.rating,
      bestRating: user.bestRating,
    },
  });
}

export async function getUserById(req, res) {
  const { userId } = req.params;
  if (!userId) throw new ApiError(400, "A user ID is required.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) throw new ApiError(404, "User not found.");

  const [totalBattles, wins] = await Promise.all([
    prisma.battleParticipant.count({
      where: { userId, battle: { status: "COMPLETED" } },
    }),
    prisma.battleParticipant.count({
      where: {
        userId,
        result: "WIN",
        battle: { status: "COMPLETED" },
      },
    }),
  ]);

  return res.json({
    success: true,
    user: {
      ...user,
      stats: {
        totalBattles,
        wins,
        winRate: totalBattles
          ? Number(((wins / totalBattles) * 100).toFixed(1))
          : 0,
      },
    },
  });
}

export default { getMyProfile, updateMyProfile, getMyStats, getUserById };