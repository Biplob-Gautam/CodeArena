import { getLeaderboard as loadLeaderboard } from "../services/leaderboardService.js";

export async function getLeaderboard(req, res) {
  const leaderboard = await loadLeaderboard({
    page: req.query.page,
    limit: req.query.limit,
  });

  return res.json({
    success: true,
    leaderboard: leaderboard.entries,
    pagination: leaderboard.pagination,
  });
}

export default { getLeaderboard };