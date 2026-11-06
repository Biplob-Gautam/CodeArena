
import { useEffect, useState } from "react";

function BattleTimer({ initialMinutes = 30, onTimeUp }) {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running || seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [running, seconds]);

  useEffect(() => {
    if (seconds === 0) {
      setRunning(false);
      onTimeUp?.();
    }
  }, [seconds, onTimeUp]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedTime =
    `${String(minutes).padStart(2, "0")}:` +
    `${String(remainingSeconds).padStart(2, "0")}`;

  const isLowTime = seconds <= 300;

  return (
    <div className="rounded-xl border border-slate-700 bg-[#101827] px-5 py-3 text-center">

      <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500">
        TIME REMAINING
      </p>

      <h2
        className={`font-mono text-3xl font-extrabold ${
          isLowTime ? "text-red-400" : "text-blue-400"
        }`}
      >
        {formattedTime}
      </h2>

      <p className="mt-1 text-[10px] text-slate-500">
        {seconds === 0
          ? "Time's up!"
          : isLowTime
          ? "Hurry up!"
          : "Battle in progress"}
      </p>

    </div>
  );
}

export default BattleTimer;
