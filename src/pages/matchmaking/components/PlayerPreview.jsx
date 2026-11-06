
function PlayerPreview({
  username = "CodeNinja",
  rating = 1450,
  wins = 32,
  battles = 48,
  winRate,
  isCurrentPlayer = false,
}) {
  const initials = username
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const calculatedWinRate =
    winRate ?? (battles > 0 ? (wins / battles) * 100 : 0);

  return (
    <div
      className={`w-full rounded-2xl border p-6 transition ${
        isCurrentPlayer
          ? "border-blue-500/30 bg-blue-500/5"
          : "border-violet-500/30 bg-violet-500/5"
      }`}
    >

      {/* Player Identity */}
      <div className="flex flex-col items-center text-center">

        <div className="relative">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${
              isCurrentPlayer
                ? "from-blue-500 to-cyan-500"
                : "from-violet-500 to-purple-600"
            } text-2xl font-extrabold text-white`}
          >
            {initials}
          </div>

          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#101827] bg-green-400" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-white">
          {username}
        </h3>

        <span
          className={`mt-2 rounded-full px-3 py-1 text-[10px] font-bold ${
            isCurrentPlayer
              ? "bg-blue-500/10 text-blue-400"
              : "bg-violet-500/10 text-violet-400"
          }`}
        >
          {isCurrentPlayer ? "YOU" : "OPPONENT"}
        </span>

        <p className="mt-4 text-3xl font-extrabold text-white">
          {rating.toLocaleString()}
        </p>

        <p className="text-xs text-slate-500">
          Elo Rating
        </p>

      </div>

      {/* Player Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-700 pt-5">

        <div className="text-center">
          <p className="text-lg font-bold text-green-400">
            {wins}
          </p>
          <p className="text-[10px] text-slate-500">
            Wins
          </p>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-blue-400">
            {battles}
          </p>
          <p className="text-[10px] text-slate-500">
            Battles
          </p>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-yellow-400">
            {calculatedWinRate.toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">
            Win Rate
          </p>
        </div>

      </div>

    </div>
  );
}

export default PlayerPreview;
