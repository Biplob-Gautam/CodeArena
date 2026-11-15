function RatingChange({ players }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#101827] p-6">
      <h2 className="mb-6 text-xl font-bold text-white">
        Rating Changes
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {players.map((player) => {
          const hasRatingChange = Number.isFinite(player.ratingChange);
          const increased = hasRatingChange && player.ratingChange > 0;
          const decreased = hasRatingChange && player.ratingChange < 0;

          return (
            <div
              key={player.username}
              className="rounded-xl border border-slate-800 bg-[#080b14] p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 font-bold text-blue-400">
                  {player.username.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    {player.username}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Rating update
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Previous Rating
                  </p>

                  <p className="mt-1 text-lg font-semibold text-white">
                    {player.previousRating ?? "—"}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    Change
                  </p>

                  <p
                    className={`mt-1 text-lg font-bold ${
                      increased
                        ? "text-green-400"
                        : decreased
                          ? "text-red-400"
                          : "text-slate-300"
                    }`}
                  >
                    {increased ? "+" : ""}
                    {player.ratingChange ?? "—"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    New Rating
                  </p>

                  <p className="mt-1 text-lg font-semibold text-white">
                    {player.newRating ?? "—"}
                  </p>
                </div>
              </div>

              <div
                className={`mt-4 rounded-lg px-3 py-2 text-center text-sm font-medium ${
                  increased
                    ? "bg-green-500/10 text-green-400"
                    : decreased
                      ? "bg-red-500/10 text-red-400"
                      : "bg-slate-500/10 text-slate-300"
                }`}
              >
                {increased
                  ? "↑ Rating Increased"
                  : decreased
                    ? "↓ Rating Decreased"
                    : hasRatingChange
                      ? "Rating Unchanged"
                      : "Rating change unavailable"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RatingChange;