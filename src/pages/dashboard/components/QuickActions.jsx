
const actions = [
  {
    title: "1v1 Battle",
    description: "Challenge a programmer of your skill level.",
    icon: "⚔",
    color: "blue",
  },
  {
    title: "Practice Problems",
    description: "Improve your coding and problem-solving skills.",
    icon: "⌘",
    color: "purple",
  },
  {
    title: "Leaderboard",
    description: "Check your position among top players.",
    icon: "♜",
    color: "orange",
  },
];

function QuickActions({ onStartBattle }) {
  const handleAction = (title) => {
    if (title === "1v1 Battle") {
      onStartBattle();
    } else {
      alert(`${title} page will be available soon!`);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#101827] p-5">

      <div className="mb-5">
        <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500">
          JUMP RIGHT IN
        </p>

        <h2 className="text-lg font-bold text-white">
          Quick Actions
        </h2>
      </div>

      <div className="space-y-2">

        {actions.map((action) => (
          <button
            key={action.title}
            onClick={() => handleAction(action.title)}
            className="group flex w-full items-center gap-4 rounded-xl border border-transparent p-3 text-left transition hover:border-slate-700 hover:bg-slate-800/70"
          >

            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                action.color === "blue"
                  ? "bg-blue-500/10 text-blue-400"
                  : action.color === "purple"
                  ? "bg-violet-500/10 text-violet-400"
                  : "bg-orange-500/10 text-orange-400"
              }`}
            >
              {action.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-200">
                {action.title}
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {action.description}
              </p>
            </div>

            <span className="text-lg text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400">
              →
            </span>

          </button>
        ))}

      </div>
    </section>
  );
}

export default QuickActions;
