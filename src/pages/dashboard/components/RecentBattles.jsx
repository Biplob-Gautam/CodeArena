function RecentBattles({ battles = [], loading = false }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#101827] p-5 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500">
            YOUR MATCH HISTORY
          </p>
          <h2 className="text-lg font-bold text-white">Recent Battles</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left">
          <thead>
            <tr className="border-b border-slate-700 text-[10px] font-bold tracking-wider text-slate-500">
              <th className="px-3 py-4">OPPONENT</th>
              <th className="px-3 py-4">PROBLEM</th>
              <th className="px-3 py-4">RESULT</th>
              <th className="px-3 py-4">RATING</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  Loading recent battles...
                </td>
              </tr>
            )}
            {!loading && battles.map((battle) => {
              const opponent = battle.opponent?.username || "Opponent unavailable";
              const initials = opponent
                .split(/\s+/)
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const resultLabel = {
                WIN: "Victory",
                LOSS: "Defeat",
                DRAW: "Draw",
              }[battle.result] || "Unknown";
              const ratingChange = Number(battle.ratingChange) || 0;
              const resultStyle =
                battle.result === "WIN"
                  ? "bg-green-500/10 text-green-400"
                  : battle.result === "LOSS"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-slate-500/10 text-slate-300";
              const ratingStyle =
                ratingChange > 0
                  ? "text-green-400"
                  : ratingChange < 0
                    ? "text-red-400"
                    : "text-slate-400";
              const date = battle.endedAt
                ? new Date(battle.endedAt).toLocaleDateString()
                : "Date unavailable";

              return (
                <tr
                  key={battle.id}
                  className="border-b border-slate-800/80 transition hover:bg-slate-800/30"
                >
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
                        {initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          {opponent}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {date}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-xs text-slate-300">
                        {battle.problem?.title || "Problem unavailable"}
                      </span>
                      {battle.problem?.difficulty && (
                        <span className="rounded-md bg-slate-700/50 px-2 py-1 text-[10px] font-medium text-slate-300">
                          {battle.problem.difficulty}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${resultStyle}`}
                    >
                      {resultLabel}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`text-xs font-bold ${ratingStyle}`}>
                      {ratingChange > 0 ? "+" : ""}
                      {ratingChange}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!loading && battles.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  No completed battles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default RecentBattles;
