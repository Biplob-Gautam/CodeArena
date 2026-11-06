
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MatchFound from "./components/MatchFound";
import MatchmakingLoader from "./components/MatchmakingLoader";

function Matchmaking() {
  const navigate = useNavigate();

  // Matchmaking states: idle, searching, found
  const [status, setStatus] = useState("idle");

  // Current player details
  const player = {
    username: "Sagnik",
    rating: 1420,
    wins: 32,
    battles: 48,
  };

  // Demo opponent details
  const opponent = {
    username: "CodeNinja",
    rating: 1450,
    wins: 35,
    battles: 52,
  };

  // Simulated matchmaking process
  useEffect(() => {
    if (status !== "searching") return;

    const timeout = setTimeout(() => {
      setStatus("found");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [status]);

  // Start matchmaking
  const handleFindOpponent = () => {
    setStatus("searching");
  };

  // Cancel matchmaking
  const handleCancelSearch = () => {
    setStatus("idle");
  };

  // Decline the found match
  const handleDeclineMatch = () => {
    setStatus("idle");
  };

  // Accept match and enter battle
  const handleAcceptMatch = () => {
    navigate("/battle/demo-battle-001");
  };

  return (
    <div className="min-h-screen bg-[#080b14] px-4 py-8 text-white md:px-8">

      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">

          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-blue-400">
              CODEARENA / MATCHMAKING
            </p>

            <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
              Find Your Opponent
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Challenge developers around your skill level.
              Compete in real-time coding battles and improve
              your Elo rating.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-700 px-5 py-3 text-xs font-semibold text-slate-300 transition hover:border-blue-500 hover:text-white"
          >
            ← Back to Dashboard
          </button>

        </div>

        {/* Player Rating Card */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#101827] p-5">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold">
              S
            </div>

            <div>
              <h2 className="font-bold text-white">
                {player.username}
              </h2>

              <p className="text-xs text-slate-500">
                Your current Elo rating
              </p>
            </div>

          </div>

          <div className="text-right">
            <p className="text-2xl font-extrabold text-blue-400">
              {player.rating}
            </p>

            <p className="text-[10px] font-bold tracking-widest text-slate-500">
              ELO RATING
            </p>
          </div>

        </div>

        {/* Main Matchmaking Content */}
        {status === "idle" && (
          <div className="rounded-2xl border border-slate-800 bg-[#101827] p-8 text-center md:p-14">

            <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20">
              <span className="text-5xl text-blue-400">
                ⚔
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-white md:text-3xl">
              Ready for a Coding Battle?
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400">
              Find an opponent with a similar Elo rating
              and test your programming skills in a
              competitive 1 vs 1 environment.
            </p>

            {/* Match Details */}
            <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-4">

              <div className="rounded-xl border border-slate-700 bg-[#080b14] p-4">
                <p className="text-xl font-bold text-blue-400">
                  1 vs 1
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Match Type
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#080b14] p-4">
                <p className="text-xl font-bold text-violet-400">
                  30 Min
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Battle Duration
                </p>
              </div>

            </div>

            {/* Find Opponent Button */}
            <button
              onClick={handleFindOpponent}
              className="mt-10 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-10 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition hover:scale-105 hover:opacity-90"
            >
              ⚔ Find Opponent
            </button>

            <p className="mt-4 text-[10px] text-slate-500">
              Matchmaking is based on player skill ratings.
            </p>

          </div>
        )}

        {/* Searching State */}
        {status === "searching" && (
          <MatchmakingLoader
            rating={player.rating}
            onCancel={handleCancelSearch}
          />
        )}

        {/* Match Found State */}
        {status === "found" && (
          <MatchFound
            player={player}
            opponent={opponent}
            onAccept={handleAcceptMatch}
            onDecline={handleDeclineMatch}
          />
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-800 py-6 text-center">
          <p className="text-xs text-slate-600">
            CodeArena © 2026 | Think Fast. Code Smart. Win Together.
          </p>
        </footer>

      </div>

    </div>
  );
}

export default Matchmaking;
