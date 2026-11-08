
import { useState } from "react";

import BattleHeader from "./components/BattleHeader";
import BattleTimer from "./components/BattleTimer";
import PlayerCard from "./components/PlayerCard";
import ProblemPanel from "./components/ProblemPanel";
import LanguageSelector from "./components/LanguageSelector";
import CodeEditor, { starterCode } from "./components/CodeEditor";
import SubmissionPanel from "./components/SubmissionPanel";

function BattleRoom({ onExit }) {
  const [language, setLanguage] = useState("JavaScript");

  const [code, setCode] = useState(
    starterCode.JavaScript
  );

  const [submission, setSubmission] = useState(null);

  const [submissions, setSubmissions] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(starterCode[newLanguage] || "");
  };

  const handleSubmit = () => {
    if (!code.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Frontend demonstration only.
    // Replace this with your backend submission API.

    setSubmission({
      status: "Awaiting Backend Judge",
      language,
      code,
      time: new Date().toLocaleTimeString(),
    });

    setSubmissions((previous) => previous + 1);

    setIsSubmitting(false);
  };

  const handleTimeUp = () => {
    alert("Battle time is over!");
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-white">

      {/* Battle Header */}
      <BattleHeader onExit={onExit} />

      <main className="mx-auto max-w-450 space-y-6 p-4 md:p-6">

        {/* Battle Overview */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Player One */}
          <PlayerCard
            username="Sagnik"
            rating={1420}
            submissions={submissions}
            isCurrentPlayer={true}
          />

          {/* Timer */}
          <div className="flex items-center justify-center">
            <BattleTimer
              initialMinutes={30}
              onTimeUp={handleTimeUp}
            />
          </div>

          {/* Player Two */}
          <PlayerCard
            username="CodeNinja"
            rating={1450}
            submissions={2}
          />

        </section>

        {/* Battle Information */}
        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <p className="text-[10px] font-bold tracking-widest text-blue-400">
              LIVE CODING CHALLENGE
            </p>

            <h1 className="mt-1 text-xl font-extrabold text-white md:text-2xl">
              Your Battle Arena
            </h1>

            <p className="mt-2 text-xs text-slate-500">
              Solve the problem before the timer runs out.
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
            <ProblemPanel />
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
