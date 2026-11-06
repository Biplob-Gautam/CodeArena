
function ProfileStats({ stats }) {
  const statCards = [
    {
      title: "Total Battles",
      value: stats?.totalBattles ?? 48,
      icon: "⚔",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Wins",
      value: stats?.wins ?? 32,
      icon: "🏆",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      title: "Total Losses",
      value: stats?.losses ?? 16,
      icon: "📉",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      title: "Win Rate",
      value: `${stats?.winRate ?? 66.7}%`,
      icon: "📊",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      title: "Winning Streak",
      value: `${stats?.streak ?? 4} Wins`,
      icon: "🔥",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      title: "Highest Rating",
      value: stats?.bestRating ?? 1580,
      icon: "⭐",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-white">
          Performance Overview
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Your competitive coding statistics
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {statCards.map((stat, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-800 bg-[#101827] p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600"
          >

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-slate-400">
                {stat.title}
              </p>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}
              >
                <span className="text-xl">
                  {stat.icon}
                </span>
              </div>

            </div>

            <h3
              className={`mt-5 text-3xl font-extrabold ${stat.color}`}
            >
              {stat.value}
            </h3>

            <p className="mt-2 text-[10px] text-slate-500">
              Based on your battle history
            </p>

          </div>
        ))}

      </div>
    </section>
  );
}

export default ProfileStats;
