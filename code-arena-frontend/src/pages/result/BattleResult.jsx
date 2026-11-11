import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import authService from "../../services/authService";

import ResultSummary from "./components/ResultSummary";
import PlayerComparison from "./components/PlayerComparison";
import RatingChange from "./components/RatingChange";

function BattleResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const battleId = searchParams.get("battleId");
  const [battleResult, setBattleResult] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!battleId) return undefined;

    Promise.all([
      api.get(`/results/${encodeURIComponent(battleId)}`),
      authService.getCurrentUser(),
    ])
      .then(([{ result: data }, { user }]) => {
        if (active) {
          setBattleResult(data);
          setCurrentUserId(user.id);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Could not load battle results.");
      });

    return () => {
      active = false;
    };
  }, [battleId]);

  const players = useMemo(
    () =>
      (battleResult?.players ?? []).map((player) => {
        const submission =
          player.firstAcceptedSubmission ?? player.latestSubmission;
        return {
          username:
            player.user.displayName || player.user.username || "Player",
          rating: Math.round(player.ratingBefore ?? player.user.rating ?? 1500),
          testCases: submission?.passedTestCases ?? player.passedTestCases ?? 0,
          executionTime: submission?.executionTimeMs
            ? Number((submission.executionTimeMs / 1000).toFixed(3))
            : 0,
          submissions: player.totalSubmissions,
          submissionStatus: player.latestSubmission?.status ?? "NO_SUBMISSIONS",
          memoryUsedKb: submission?.memoryUsedKb ?? 0,
          isWinner: player.result === "WIN",
          previousRating: Math.round(player.ratingBefore ?? player.user.rating ?? 1500),
          ratingChange: Math.round(player.ratingChange ?? 0),
          newRating: Math.round(player.ratingAfter ?? player.user.rating ?? 1500),
        };
      }),
    [battleResult],
  );

  const ownPlayer = battleResult?.players?.find(
    (player) => player.user?.id === currentUserId,
  );
  const status = ownPlayer?.result === "WIN"
    ? "won"
    : ownPlayer?.result === "DRAW"
    ? "draw"
    : "lost";
  const startsAt = battleResult?.startsAt
    ? new Date(battleResult.startsAt)
    : null;
  const endsAt = battleResult?.endsAt ? new Date(battleResult.endsAt) : null;
  const durationSeconds =
    startsAt && endsAt
      ? Math.min(
          battleResult.durationSeconds,
          Math.max(0, Math.floor((endsAt.getTime() - startsAt.getTime()) / 1000)),
        )
      : battleResult?.durationSeconds ?? 0;
  const result = {
    status,
    problemTitle: battleResult?.problem?.title ?? "—",
    difficulty: battleResult?.problem?.difficulty ?? "—",
    duration: `${Math.floor(durationSeconds / 60)} min ${durationSeconds % 60} sec`,
    date: endsAt ? endsAt.toLocaleDateString() : "—",
    winner:
      players.find((player) => player.isWinner)?.username ?? null,
  };

  if (!battleResult && !error && battleId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b14] text-slate-300">
        Loading battle results...
      </div>
    );
  }

  if (!battleId || error || battleResult?.status !== "COMPLETED") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080b14] px-4 text-center text-white">
        <p role="alert" className="text-red-400">
          {error || (!battleId
            ? "A battle ID is required to view results."
            : "This battle has not completed yet.")}
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-xl border border-slate-700 px-7 py-3 font-semibold text-slate-300"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

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
            Battle Completed · {battleId}
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
            className="rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-7 py-3 font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:scale-[1.02] hover:from-blue-500 hover:to-violet-500"
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