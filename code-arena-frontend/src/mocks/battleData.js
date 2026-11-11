
export const mockBattleData = {
  battleId: "CA-2026-001",
  status: "completed",
  problem: {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description:
      "Given an array of integers and a target, return the indices of two numbers that add up to the target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10000",
      "Each input has exactly one solution.",
    ],
  },
  duration: "18 min 24 sec",
  players: [
    {
      id: "user-001",
      username: "Sagnik",
      rating: 1420,
      testCases: 10,
      executionTime: 1.2,
      submissions: 2,
      isWinner: true,
      previousRating: 1420,
      ratingChange: 25,
      newRating: 1445,
    },
    {
      id: "user-002",
      username: "CodeNinja",
      rating: 1450,
      testCases: 7,
      executionTime: 2.4,
      submissions: 4,
      isWinner: false,
      previousRating: 1450,
      ratingChange: -15,
      newRating: 1435,
    },
  ],
};

export const mockBattleHistory = [
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
];
