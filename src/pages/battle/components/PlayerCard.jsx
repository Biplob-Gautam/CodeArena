
function PlayerCard({
  username = "Sagnik",
  rating = 1420,
  submissions = 0,
  isCurrentPlayer = false,
  isOnline = true,
}) {
  const initials = username
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`rounded-xl border p-4 ${
        isCurrentPlayer
          ? "border-blue-500/30 bg-blue-500/5"
          : "border-slate-700 bg-[#101827]"
      }`}
    >
      <div className="flex items-center gap-3">

        {/* Avatar */}
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white">
            {initials}
          </div>

          <span
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#101827] ${
              isOnline ? "bg-green-400" : "bg-slate-500"
            }`}
          />
        </div>

        {/* Player Information */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-white">
              {username}
            </h3>

            {isCurrentPlayer && (
              <span className="rounded bg-blue-500/10 px-2 py-1 text-[9px] font-bold text-blue-400">
                YOU
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {rating.toLocaleString()} Elo Rating
          </p>
        </div>

      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-3">
        <span className="text-xs text-slate-500">
          Submissions
        </span>

        <span className="text-sm font-bold text-white">
          {submissions}
        </span>
      </div>

    </div>
  );
}

export default PlayerCard;
