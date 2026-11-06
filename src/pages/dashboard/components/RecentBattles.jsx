
const battles = [
  {
    opponent: "CodeNinja",
    initials: "CN",
    problem: "Two Sum",
    difficulty: "Easy",
    result: "Victory",
    rating: "+24",
    time: "2 hours ago",
  },
  {
    opponent: "AlgoMaster",
    initials: "AM",
    problem: "Binary Tree Paths",
    difficulty: "Medium",
    result: "Defeat",
    rating: "-16",
    time: "Yesterday",
  },
  {
    opponent: "ByteHunter",
    initials: "BH",
    problem: "Longest Substring",
    difficulty: "Medium",
    result: "Victory",
    rating: "+21",
    time: "Yesterday",
  },
  {
    opponent: "DevStorm",
    initials: "DS",
    problem: "Merge Intervals",
    difficulty: "Hard",
    result: "Victory",
    rating: "+32",
    time: "2 days ago",
  },
];

function RecentBattles() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#101827] p-5 md:p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500">
            YOUR MATCH HISTORY
          </p>

          <h2 className="text-lg font-bold text-white">
            Recent Battles
          </h2>
        </div>

        <button
          onClick={() => alert("Full battle history coming soon!")}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300"
        >
          View All →
        </button>
      </div>

      {/* Battle Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">

          <thead>
            <tr className="border-b border-slate-700 text-[10px] font-bold tracking-wider text-slate-500">
              <th className="px-3 py-4">OPPONENT</th>
              <th className="px-3 py-4">PROBLEM</th>
              <th className="px-3 py-4">RESULT</th>
              <th className="px-3 py-4">RATING</th>
            </tr>
          </thead>

          <tbody>
            {battles.map((battle) => (
              <tr
                key={battle.opponent}
                className="border-b border-slate-800/80 transition hover:bg-slate-800/30"
              >

                {/* Opponent */}
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                      {battle.initials}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {battle.opponent}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        {battle.time}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Problem */}
                <td className="px-3 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-xs text-slate-300">
                      {battle.problem}
                    </span>

                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                        battle.difficulty === "Easy"
                          ? "bg-green-500/10 text-green-400"
                          : battle.difficulty === "Medium"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {battle.difficulty}
                    </span>
                  </div>
                </td>

                {/* Result */}
                <td className="px-3 py-4">
                  <span
                    className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                      battle.result === "Victory"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {battle.result}
                  </span>
                </td>

                {/* Rating */}
                <td className="px-3 py-4">
                  <span
                    className={`text-xs font-bold ${
                      battle.rating.startsWith("+")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {battle.rating}
                  </span>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </section>
  );
}

export default RecentBattles;
