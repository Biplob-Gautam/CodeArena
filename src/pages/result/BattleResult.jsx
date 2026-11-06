import { useNavigate } from "react-router-dom";

import ResultSummary from "./components/ResultSummary";
import PlayerComparison from "./components/PlayerComparison";
import RatingChange from "./components/RatingChange";

function BattleResult() {
  const navigate = useNavigate();

  // Demo battle result data
  const result = {
    status: "won",
    problemTitle: "Two Sum",
    difficulty: "Easy",
    duration: "18 min 24 sec",
    date: "November 4, 2026",
    winner: "Sagnik",
  };

  // Demo player comparison data
  const players = [
    {
      username: "Sagnik",
      rating: 1420,
      testCases: 10,
      executionTime: 1.2,
      submissions: 2,
      isWinner: true,

      previousRating: 1420,
      ratingChange: 25,
      newRating: 1445,
    },
    {
      username: "CodeNinja",
      rating: 1450,
      testCases: 7,
      executionTime: 2.4,
      submissions: 4,
      isWinner: false,

      previousRating: 1450,
      ratingChange: -15,
      newRating: 1435,
    },
  ];

  return (
    <div className="min-h-screen bg-[#080b14] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-400">
                &lt;/&gt;
              </span>

              <span className="text-lg font-bold">
                CodeArena
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Battle Results
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Here's a breakdown of your latest coding battle.
            </p>
          </div>

          <span className="w-fit rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
            Battle Completed
          </span>
        </div>

        {/* Result Summary */}
        <ResultSummary result={result} />

        {/* Player Comparison */}
        <div className="mt-6">
          <PlayerComparison players={players} />
        </div>

        {/* Rating Changes */}
        <div className="mt-6">
          <RatingChange players={players} />
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-slate-700 px-7 py-3 font-semibold text-slate-300 transition hover:border-blue-500 hover:text-white"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/matchmaking")}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3 font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:scale-[1.02] hover:from-blue-500 hover:to-violet-500"
          >
            Play Again
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          CodeArena © 2026 | Think Fast. Code Smart. Win Together.
        </footer>
      </div>
    </div>
  );
}

export default BattleResult;