
export const mockDashboardStats = {
  totalBattles: 48,
  wins: 32,
  losses: 16,
  winRate: 66.7,
  currentStreak: 4,
  bestRating: 1580,
};

export const mockRecentBattles = [
  {
    id: "CA-001",
    opponent: "CodeNinja",
    result: "Won",
    ratingChange: 25,
    date: "Today",
  },
  {
    id: "CA-002",
    opponent: "DevMaster",
    result: "Lost",
    ratingChange: -12,
    date: "Yesterday",
  },
  {
    id: "CA-003",
    opponent: "AlgoKing",
    result: "Won",
    ratingChange: 20,
    date: "2 days ago",
  },
  {
    id: "CA-004",
    opponent: "ByteHunter",
    result: "Won",
    ratingChange: 18,
    date: "3 days ago",
  },
];

export const mockQuickActions = [
  {
    id: 1,
    title: "Find a Match",
    description: "Challenge another developer",
    path: "/matchmaking",
  },
  {
    id: 2,
    title: "View Profile",
    description: "Check your coding statistics",
    path: "/profile",
  },
  {
    id: 3,
    title: "Leaderboard",
    description: "See top competitive coders",
    path: "/leaderboard",
  },
];
