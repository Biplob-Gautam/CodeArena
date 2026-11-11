
function MatchmakingLoader({
  rating = 1420,
  onCancel,
}) {
  return (
    <div className="flex min-h-105 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#101827] p-8 text-center">

      {/* Animated Search Circle */}
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center">

        <div className="absolute inset-0 animate-ping rounded-full border border-blue-500/20" />

        <div className="absolute inset-2 animate-pulse rounded-full border-2 border-blue-500/40" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
          <span className="text-3xl font-bold text-white">
            {"</>"}
          </span>
        </div>

      </div>

      <h2 className="text-2xl font-extrabold text-white">
        Finding Your Opponent
      </h2>

      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
        Searching for a player with a similar skill level.
        Get ready for an exciting coding battle!
      </p>

      {/* Searching Animation */}
      <div className="mt-8 flex items-center gap-2">
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
      </div>

      <div className="mt-6 rounded-xl border border-slate-700 bg-[#080b14] px-6 py-3">
        <p className="text-[10px] font-bold tracking-widest text-slate-500">
          YOUR ELO RATING
        </p>

        <p className="mt-1 text-2xl font-extrabold text-blue-400">
          {rating}
        </p>
      </div>

      <button
        onClick={onCancel}
        className="mt-8 rounded-lg border border-red-500/30 px-6 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
      >
        Cancel Search
      </button>

    </div>
  );
}

export default MatchmakingLoader;

