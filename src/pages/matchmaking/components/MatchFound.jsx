
import PlayerPreview from "./PlayerPreview";

function MatchFound({
  player,
  opponent,
  onAccept,
  onDecline,
}) {
  return (
    <div className="rounded-2xl border border-green-500/20 bg-[#101827] p-6 md:p-8">

      {/* Match Found Heading */}
      <div className="mb-8 text-center">

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <span className="text-3xl text-green-400">
            ✓
          </span>
        </div>

        <h2 className="text-3xl font-extrabold text-white">
          Match Found!
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Your opponent is ready. Are you ready to battle?
        </p>

        <span className="mt-4 inline-block rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-bold text-green-400">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-400" />
          OPPONENT CONNECTED
        </span>

      </div>

      {/* Players Comparison */}
      <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr]">

        <PlayerPreview
          {...player}
          isCurrentPlayer={true}
        />

        {/* VS */}
        <div className="flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-[#080b14]">
            <span className="text-lg font-black text-violet-400">
              VS
            </span>
          </div>
        </div>

        <PlayerPreview
          {...opponent}
          isCurrentPlayer={false}
        />

      </div>

      {/* Match Information */}
      <div className="mt-8 rounded-xl border border-slate-700 bg-[#080b14] p-4 text-center">

        <p className="text-xs font-bold tracking-widest text-slate-500">
          BATTLE FORMAT
        </p>

        <p className="mt-2 text-lg font-bold text-white">
          1 vs 1 Coding Battle
        </p>

        <p className="mt-1 text-xs text-slate-500">
          One problem · Same time limit · Fair competition
        </p>

      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

        <button
          onClick={onDecline}
          className="rounded-xl border border-red-500/30 px-8 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
        >
          Decline Match
        </button>

        <button
          onClick={onAccept}
          className="rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-10 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] hover:opacity-90"
        >
          Accept & Enter Battle →
        </button>

      </div>

    </div>
  );
}

export default MatchFound;
