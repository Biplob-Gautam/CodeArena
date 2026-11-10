function RatingCard({ user }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#101827] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500">
            COMPETITIVE PROFILE
          </p>
          <h2 className="text-lg font-bold text-white">Your Rating</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-xl text-yellow-400">
          ✦
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs text-slate-400">Current rating</p>
          <p className="mt-2 text-3xl font-extrabold text-white">
            {user?.rating?.toLocaleString() ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs text-slate-400">Best rating</p>
          <p className="mt-2 text-3xl font-extrabold text-yellow-400">
            {user?.bestRating?.toLocaleString() ?? "—"}
          </p>
        </div>
      </div>
    </section>
  );
}

export default RatingCard;
