
function ProfileHeader({ user, onEditProfile }) {
  const initials = (user?.username || "User")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101827]">

      {/* Cover Background */}
      <div className="relative h-36 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 md:h-48">
        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute right-6 top-5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
          CODEARENA MEMBER
        </div>
      </div>

      {/* Profile Information */}
      <div className="px-6 pb-6">

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          {/* Avatar and Details */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

            <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-[#101827] bg-gradient-to-br from-blue-500 to-violet-600 text-3xl font-extrabold text-white shadow-xl md:h-28 md:w-28">
              {initials}
            </div>

            <div className="sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">
                  {user?.username || "CodeArena User"}
                </h1>

                <span className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-bold text-green-400">
                  ACTIVE
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                {user?.email || "user@example.com"}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Member since {user?.joinedDate || "January 2026"}
              </p>
            </div>

          </div>

          {/* Edit Button */}
          <button
            onClick={onEditProfile}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-white"
          >
            <span>✎</span>
            Edit Profile
          </button>

        </div>

        {/* Rating Information */}
        <div className="mt-7 grid grid-cols-2 gap-4 border-t border-slate-800 pt-6 sm:grid-cols-3">

          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-500">
              ELO RATING
            </p>
            <p className="mt-2 text-2xl font-extrabold text-blue-400">
              {user?.rating ?? 1420}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-500">
              GLOBAL RANK
            </p>
            <p className="mt-2 text-2xl font-extrabold text-violet-400">
              #{user?.rank ?? 256}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold tracking-widest text-slate-500">
              SKILL LEVEL
            </p>
            <p className="mt-2 text-2xl font-extrabold text-yellow-400">
              {user?.level || "Intermediate"}
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default ProfileHeader;
