
function RatingCard() {
  const rating = 1420;
  const progress = 71;

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#101827] p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500">
            COMPETITIVE PROFILE
          </p>

          <h2 className="text-lg font-bold text-white">
            Your Rating
          </h2>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-xl text-yellow-400">
          ✦
        </div>
      </div>

      {/* Rating */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-4xl font-extrabold tracking-tight text-white">
            {rating.toLocaleString()}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Current Elo Rating
          </p>
        </div>

        <span className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs font-bold tracking-wider text-yellow-400">
          GOLD III
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Progress to Platinum
        </span>

        <span className="font-bold text-blue-400">
          {progress}%
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-700"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Footer */}
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>
          1,200 <span className="ml-1">Gold</span>
        </span>

        <span>
          1,500 <span className="ml-1">Platinum</span>
        </span>
      </div>

    </section>
  );
}

export default RatingCard;
