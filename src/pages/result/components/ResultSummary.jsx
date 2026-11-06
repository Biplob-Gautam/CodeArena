function ResultSummary({ result }) {
  const isWin = result.status === "won";
  const isDraw = result.status === "draw";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#101827] p-6 sm:p-8">
      <div
        className={`absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl ${
          isWin
            ? "bg-green-500/10"
            : isDraw
            ? "bg-yellow-500/10"
            : "bg-red-500/10"
        }`}
      />

      <div className="relative text-center">
        <div className="mb-4 text-5xl">
          {isWin ? "🏆" : isDraw ? "🤝" : "💪"}
        </div>

        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-slate-400">
          Battle Completed
        </p>

        <h1
          className={`text-3xl font-bold sm:text-4xl ${
            isWin
              ? "text-green-400"
              : isDraw
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          {isWin ? "Victory!" : isDraw ? "It's a Draw!" : "Defeat"}
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
          {isWin
            ? "Congratulations! You won this coding battle. Keep improving your skills."
            : isDraw
            ? "Both players performed equally. Great effort from both sides!"
            : "Good effort! Every battle is an opportunity to learn and improve."}
        </p>
      </div>

      <div className="relative mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#080b14] p-4 text-center">
          <p className="text-xs text-slate-500">Problem</p>
          <h3 className="mt-2 font-semibold text-white">
            {result.problemTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {result.difficulty}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#080b14] p-4 text-center">
          <p className="text-xs text-slate-500">Battle Duration</p>
          <h3 className="mt-2 font-semibold text-white">
            {result.duration}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {result.date}
          </p>
        </div>
      </div>

      <div className="relative mt-5 rounded-xl border border-slate-800 bg-[#080b14] p-4 text-center">
        <p className="text-xs text-slate-500">Winner</p>
        <h2 className="mt-2 text-xl font-bold text-white">
          {result.winner || "No Winner"}
        </h2>
      </div>
    </div>
  );
}

export default ResultSummary;