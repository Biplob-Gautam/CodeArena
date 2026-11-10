
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import authService from "../../services/authService";
import submissionService from "../../services/submissionService";
import {
  connectSocket,
  disconnectSocket,
  onSocket,
} from "../../sockets/socket";

import BattleHeader from "./components/BattleHeader";
import BattleTimer from "./components/BattleTimer";
import PlayerCard from "./components/PlayerCard";
import ProblemPanel from "./components/ProblemPanel";
import LanguageSelector from "./components/LanguageSelector";
import CodeEditor from "./components/CodeEditor";
import starterCode from "./starterCode";
import SubmissionPanel from "./components/SubmissionPanel";

function BattleRoom({ onExit }) {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const [battle, setBattle] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const [socketError, setSocketError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [language, setLanguage] = useState("JavaScript");

  const [code, setCode] = useState(
    starterCode.JavaScript
  );

  const [submission, setSubmission] = useState(null);

  const [submissions, setSubmissions] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!battleId) return undefined;

    let active = true;
    const socket = connectSocket();
    const updateBattle = (nextBattle) => {
      if (!active || nextBattle?.id !== battleId) return;
      const remainingSeconds = nextBattle.startsAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(nextBattle.startsAt).getTime() +
                nextBattle.durationSeconds * 1000 -
                Date.now()) /
                1000,
            ),
          )
        : nextBattle.durationSeconds;
      setBattle({ ...nextBattle, remainingSeconds });
      setSocketError("");
      if (nextBattle.status === "COMPLETED") {
        navigate(`/result?battleId=${encodeURIComponent(battleId)}`);
      }
    };
    const joinBattle = () => socket.emit("battle:join", { battleId });
    const handleConnect = () => {
      setSocketError("");
      joinBattle();
    };
    authService
      .getCurrentUser()
      .then(({ user }) => {
        if (active) setCurrentUserId(user.id);
      })
      .catch((requestError) => {
        if (active) setSocketError(requestError.message);
      });
    const removeListeners = [
      onSocket("battle:joined", ({ battle: nextBattle } = {}) => {
        updateBattle(nextBattle);
      }),
      onSocket("battle:state", ({ battle: nextBattle } = {}) => {
        updateBattle(nextBattle);
      }),
      onSocket("battle:presence", ({ userId, online } = {}) => {
        if (!active || !userId) return;
        setOnlineUsers((previous) => {
          const next = new Set(previous);
          if (online) next.add(userId);
          else next.delete(userId);
          return next;
        });
      }),
      onSocket("battle:error", ({ message } = {}) => {
        if (active) setSocketError(message || "Unable to load this battle.");
      }),
      onSocket("battle:completed", ({ battleId: completedBattleId } = {}) => {
        if (active && completedBattleId === battleId) {
          navigate(`/result?battleId=${encodeURIComponent(battleId)}`);
        }
      }),
      onSocket("connect_error", () => {
        if (active) setSocketError("Could not connect to the battle server.");
      }),
      onSocket("connect", handleConnect),
    ];

    if (socket.connected) joinBattle();

    return () => {
      active = false;
      removeListeners.forEach((remove) => remove());
      disconnectSocket();
    };
  }, [battleId, navigate]);

  const participants = battle?.participants ?? [];
  const currentParticipant = participants.find(
    (participant) => participant.userId === currentUserId,
  );
  const opponent = participants.find(
    (participant) => participant.userId !== currentUserId,
  );
  const problem = useMemo(() => {
    if (!battle?.problem) return null;
    return {
      ...battle.problem,
      constraints: Array.isArray(battle.problem.constraints)
        ? battle.problem.constraints
        : [],
      examples: Array.isArray(battle.problem.examples)
        ? battle.problem.examples
        : [],
    };
  }, [battle]);
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(starterCode[newLanguage] || "");
  };

  const handleSubmit = async () => {
    if (
      !code.trim() ||
      isSubmitting ||
      battle.status !== "IN_PROGRESS" ||
      battle.remainingSeconds <= 0
    ) {
      return;
    }
    setIsSubmitting(true);
    let latest;
    try {
      latest = await submissionService.submitCode(battle.id, language, code);
    } catch (error) {
      if (isMounted.current) {
        setSubmission({
          status: "REQUEST_FAILED",
          language,
          submittedAt: new Date().toISOString(),
          error: error.message || "Could not submit your code.",
        });
        setIsSubmitting(false);
      }
      return;
    }

    if (!isMounted.current) return;
    setSubmission(latest);
    setSubmissions((previous) => previous + 1);

    try {
      for (let attempt = 0; attempt < 150; attempt += 1) {
        if (!["QUEUED", "PROCESSING"].includes(latest.status)) break;
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        latest = await submissionService.getSubmission(latest.id);
        if (!isMounted.current) return;
        setSubmission(latest);
      }

      if (["QUEUED", "PROCESSING"].includes(latest.status)) {
        setSubmission({
          ...latest,
          error: "Judging is taking longer than expected. Check this submission again shortly.",
        });
      }
    } catch (error) {
      if (isMounted.current) {
        setSubmission({
          ...latest,
          error: `Submission was recorded, but its latest result could not be loaded: ${
            error.message || "request failed"
          }`,
        });
      }
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    setBattle((previous) =>
      previous?.remainingSeconds === 0
        ? previous
        : previous
        ? { ...previous, remainingSeconds: 0 }
        : previous,
    );
    setSocketError("Battle time is over.");
  }, []);

  const displayError = battleId
    ? socketError
    : "A valid battle ID is required.";

  if (!battle && !displayError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b14] text-slate-300">
        Connecting to battle...
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080b14] px-4 text-center text-white">
        <p role="alert" className="text-red-400">{displayError}</p>
        <button
          onClick={() => navigate("/matchmaking")}
          className="rounded-lg border border-slate-700 px-5 py-3 text-sm"
        >
          Return to matchmaking
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white">

      {/* Battle Header */}
      <BattleHeader
        battleId={battle.id}
        onExit={onExit || (() => navigate("/dashboard"))}
      />

      <main className="mx-auto max-w-450 space-y-6 p-4 md:p-6">

        {/* Battle Overview */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Player One */}
          <PlayerCard
            username={
              currentParticipant?.user.displayName ||
              currentParticipant?.user.username ||
              "You"
            }
            rating={currentParticipant?.user.rating ?? 1500}
            submissions={(currentParticipant?.totalSubmissions ?? 0) + submissions}
            isCurrentPlayer
            isOnline
          />

          {/* Timer */}
          <div className="flex items-center justify-center">
            <BattleTimer
              key={battle.id}
              initialSeconds={battle.remainingSeconds}
              onTimeUp={handleTimeUp}
            />
          </div>

          {/* Player Two */}
          <PlayerCard
            username={
              opponent?.user.displayName || opponent?.user.username || "Waiting..."
            }
            rating={opponent?.user.rating ?? 1500}
            submissions={opponent?.totalSubmissions ?? 0}
            isOnline={Boolean(opponent && onlineUsers.has(opponent.userId))}
          />

        </section>

        {/* Battle Information */}
        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <p className="text-[10px] font-bold tracking-widest text-blue-400">
              LIVE CODING CHALLENGE
            </p>

            <h1 className="mt-1 text-xl font-extrabold text-white md:text-2xl">
              {problem?.title || "Your Battle Arena"}
            </h1>

            <p className="mt-2 text-xs text-slate-500">
              {socketError || "Solve the problem before the timer runs out."}
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-[#101827] px-4 py-2">
            <span className="text-xs text-slate-400">
              Match Type:
            </span>

            <span className="ml-2 text-xs font-bold text-blue-400">
              1 vs 1
            </span>
          </div>

        </div>

        {/* Main Battle Workspace */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

          {/* Left: Problem */}
          <div className="min-h-137.5">
            {problem && <ProblemPanel problem={problem} />}
          </div>

          {/* Right: Code Editor */}
          <div className="space-y-4">

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#101827] p-4">

              <h2 className="text-sm font-bold text-white">
                Code Workspace
              </h2>

              <LanguageSelector
                language={language}
                onLanguageChange={handleLanguageChange}
              />

            </div>

            <CodeEditor
              language={language}
              code={code}
              setCode={setCode}
              onSubmit={handleSubmit}
              submitting={isSubmitting}
              disabled={
                battle.status !== "IN_PROGRESS" || battle.remainingSeconds <= 0
              }
            />

          </div>

        </div>

        {/* Submission Information */}
        <SubmissionPanel submission={submission} />

        {/* Footer */}
        <footer className="border-t border-slate-800 py-5 text-center">
          <p className="text-[10px] text-slate-500">
            CodeArena © 2026 | Think Fast. Code Smart. Win Together.
          </p>
        </footer>

      </main>

    </div>
  );
}

export default BattleRoom;
