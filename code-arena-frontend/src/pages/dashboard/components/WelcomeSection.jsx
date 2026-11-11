
function WelcomeSection({ username, onStartBattle }) {
  return (
    <section className="relative mb-8 flex min-h-60 items-center justify-between overflow-hidden rounded-2xl border border-blue-500/20 bg-linear-to-r from-[#142440] via-[#151a32] to-[#21153a] p-7 md:p-9">

      {/* Background Decoration */}
      <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-40 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      {/* Welcome Content */}
      <div className="relative z-10 max-w-xl">

        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[10px] font-bold tracking-wider text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          YOUR COMPETITIVE SPACE
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
          Welcome back,{" "}
          <span className="text-blue-400">
            {username}!
          </span>
        </h1>

        <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
          Ready to sharpen your skills? Challenge a worthy opponent
          and climb the competitive rankings.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">

          <button
            onClick={onStartBattle}
            className="flex items-center gap-3 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:shadow-blue-500/30"
          >
            ⚔ Find a Battle
            <span>→</span>
          </button>

          <button
            onClick={() => alert("Practice Problems page coming soon!")}
            className="rounded-xl border border-slate-600 bg-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-blue-400 hover:text-white"
          >
            Practice Problems
          </button>

        </div>
      </div>

      {/* Decorative Coding Illustration */}
      <div className="relative mr-8 hidden h-44 w-44 shrink-0 items-center justify-center md:flex">

        <div className="absolute h-44 w-44 rounded-full border border-blue-400/20" />

        <div className="absolute h-32 w-32 rounded-full border border-violet-400/20" />

        <div className="flex h-24 w-24 rotate-[-8deg] items-center justify-center rounded-3xl border border-blue-400/30 bg-blue-500/10 text-3xl font-extrabold text-blue-300 shadow-xl shadow-blue-500/10">
          {"</>"}
        </div>

        <span className="absolute -right-4 top-4 rounded-lg border border-slate-600 bg-[#101827] px-3 py-2 font-mono text-xs text-green-400">
          {"{ }"}
        </span>

        <span className="absolute -bottom-2 -left-6 rounded-lg border border-slate-600 bg-[#101827] px-3 py-2 font-mono text-xs text-violet-400">
          010101
        </span>

      </div>

    </section>
  );
}

export default WelcomeSection;
