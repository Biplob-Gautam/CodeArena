
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import MatchmakingLoader from "./components/MatchmakingLoader";
import authService from "../../services/authService";
import battleService from "../../services/battleService";
import {
  connectSocket,
  disconnectSocket,
  emitSocket,
  onSocket,
} from "../../sockets/socket";

function Matchmaking() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const searchingRef = useRef(false);
  const handledBattleIdRef = useRef(null);

  useEffect(() => {
    let active = true;
    connectSocket();

    const setSearching = () => {
      searchingRef.current = true;
      setStatus("searching");
    };
    const setIdle = () => {
      searchingRef.current = false;
      setStatus("idle");
    };
    const handleMatched = (battle) => {
      if (!active || !battle?.id || handledBattleIdRef.current === battle.id) {
        return;
      }
      handledBattleIdRef.current = battle.id;
      searchingRef.current = false;
      navigate(`/battle/${battle.id}`, { replace: true });
    };

    const onWaiting = () => {
      if (active && searchingRef.current) setSearching();
    };
    const onMatched = ({ battle } = {}) => {
      handleMatched(battle);
    };
    const onCancelled = () => {
      if (active) setIdle();
    };
    const onError = ({ message } = {}) => {
      if (!active) return;
      setError(message || "Matchmaking is unavailable. Please try again.");
      setIdle();
    };
    const onConnectError = () => {
      if (!active) return;
      setError("Could not connect to matchmaking. Check that the backend is running.");
      setIsConnected(false);
    };

    const removeListeners = [
      onSocket("matchmaking:waiting", onWaiting),
      onSocket("matchmaking:status", ({ status: nextStatus, battle } = {}) => {
        if (!active) return;
        if (nextStatus === "MATCHED") {
          handleMatched(battle);
        } else if (nextStatus === "WAITING" && searchingRef.current) {
          setSearching();
        }
      }),
      onSocket("matchmaking:matched", onMatched),
      onSocket("matchmaking:cancelled", onCancelled),
      onSocket("matchmaking:error", onError),
      onSocket("connect_error", onConnectError),
      onSocket("connect", () => {
        if (!active) return;
        setIsConnected(true);
        setError("");
        if (searchingRef.current) emitSocket("matchmaking:join");
      }),
      onSocket("disconnect", () => {
        if (!active) return;
        setIsConnected(false);
        if (searchingRef.current) {
          setError("Connection lost. Reconnecting to matchmaking...");
        }
      }),
    ];

    authService
      .getCurrentUser()
      .then(({ user }) => {
        if (active) setPlayer(user);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
      if (searchingRef.current) {
        void battleService.cancelMatch().catch((requestError) => {
          console.error("Could not cancel matchmaking while leaving:", requestError);
        });
      }
      removeListeners.forEach((remove) => remove());
      disconnectSocket();
    };
  }, [navigate]);

  const handleFindOpponent = () => {
    setError("");
    handledBattleIdRef.current = null;
    searchingRef.current = true;
    if (!emitSocket("matchmaking:find")) {
      searchingRef.current = false;
      setStatus("idle");
      setError("Matchmaking is still connecting. Please try again.");
      return;
    }
    setStatus("searching");
  };

  const handleCancelSearch = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    setError("");
    try {
      await battleService.cancelMatch();
      searchingRef.current = false;
      setStatus("idle");
    } catch (requestError) {
      setError(requestError.message || "Could not leave the matchmaking queue.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleBackToDashboard = async () => {
    if (searchingRef.current) {
      await handleCancelSearch();
      if (searchingRef.current || handledBattleIdRef.current) return;
    }
    navigate("/dashboard");
  };

  const username = player?.displayName || player?.username || "Loading...";
  const rating = Math.round(player?.rating ?? 1500);

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
            onClick={handleBackToDashboard}
            disabled={isCancelling}
            className="rounded-lg border border-slate-700 px-5 py-3 text-xs font-semibold text-slate-300 transition hover:border-blue-500 hover:text-white"
          >
            ← Back to Dashboard
          </button>

        </div>

        {/* Player Rating Card */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#101827] p-5">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-xl font-bold">
              {username.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <h2 className="font-bold text-white">
                {username}
              </h2>

              <p className="text-xs text-slate-500">
                Your current Elo rating
              </p>
            </div>

          </div>

          <div className="text-right">
            <p className="text-2xl font-extrabold text-blue-400">
              {rating}
            </p>

            <p className="text-[10px] font-bold tracking-widest text-slate-500">
              ELO RATING
            </p>
          </div>

        </div>

        {/* Main Matchmaking Content */}
        {status === "idle" && (
          <div className="rounded-2xl border border-slate-800 bg-[#101827] p-8 text-center md:p-14">

            <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-blue-500/20 to-violet-500/20">
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
                  Varies
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Battle Duration
                </p>
              </div>

            </div>

            {/* Find Opponent Button */}
            <button
              onClick={handleFindOpponent}
              disabled={!player || !isConnected}
              className="mt-10 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-10 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition hover:scale-105 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnected ? "⚔ Find Opponent" : "Connecting..."}
            </button>

            {!player && error && (
              <button
                onClick={() => {
                  setError("");
                  authService
                    .getCurrentUser()
                    .then(({ user }) => setPlayer(user))
                    .catch((requestError) => setError(requestError.message));
                }}
                className="mt-4 block w-full text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                Retry loading your profile
              </button>
            )}

            <p className="mt-4 text-[10px] text-slate-500">
              Matchmaking is based on player skill ratings.
            </p>

          </div>
        )}

        {/* Searching State */}
        {status === "searching" && (
          <MatchmakingLoader
            rating={rating}
            onCancel={handleCancelSearch}
            cancelling={isCancelling}
          />
        )}

        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-red-400">
            {error}
          </p>
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
