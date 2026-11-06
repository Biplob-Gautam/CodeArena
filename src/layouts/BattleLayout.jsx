
function BattleLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#080b14] text-white">

      {/* Battle Top Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-[#101827] px-4 sm:px-6">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-400">
            &lt;/&gt;
          </span>

          <span className="text-lg font-bold">
            CodeArena
          </span>
        </div>

        {/* Battle Status */}
        <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-xs font-medium text-green-400 sm:text-sm">
            Live Battle
          </span>
        </div>
      </header>

      {/* Battle Content */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
        <div className="mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </main>

    </div>
  );
}

export default BattleLayout;
