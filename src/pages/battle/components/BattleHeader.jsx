
function BattleHeader({ battleId = "CA-2026-001", onExit }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-[#0b101c] px-5 py-4">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 font-bold text-white">
          {"</>"}
        </div>

        <div>
          <h1 className="text-lg font-extrabold text-white">
            Code<span className="text-blue-400">Arena</span>
          </h1>
          <p className="text-[10px] text-slate-500">
            COMPETITIVE CODING ARENA
          </p>
        </div>
      </div>

      {/* Battle Info */}
      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-[10px] text-slate-500">BATTLE ID</p>
          <p className="text-xs font-semibold text-slate-300">
            {battleId}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-xs font-bold text-green-400">
            LIVE
          </span>
        </div>

        <button
          onClick={onExit}
          className="rounded-lg border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
        >
          Exit Battle
        </button>
      </div>

    </header>
  );
}

export default BattleHeader;
