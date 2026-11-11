const colorStyles = {
  blue: "bg-blue-500/10 text-blue-400",
  green: "bg-green-500/10 text-green-400",
  purple: "bg-violet-500/10 text-violet-400",
  orange: "bg-orange-500/10 text-orange-400",
};

const textStyles = {
  blue: "text-blue-400",
  green: "text-green-400",
  purple: "text-violet-400",
  orange: "text-orange-400",
};

function StatsCards({ stats, user }) {
  const cards = [
    {
      title: "Battles Played",
      value: stats?.totalBattles ?? "—",
      description: "Completed battles",
      icon: "⚔",
      color: "blue",
    },
    {
      title: "Victories",
      value: stats?.wins ?? "—",
      description: "Won battles",
      icon: "♛",
      color: "green",
    },
    {
      title: "Win Rate",
      value: stats ? `${stats.winRate}%` : "—",
      description: "Of completed battles",
      icon: "↗",
      color: "purple",
    },
    {
      title: "Current Rating",
      value: user?.rating?.toLocaleString() ?? "—",
      description: "Competitive rating",
      icon: "✦",
      color: "orange",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat) => (
        <div
          key={stat.title}
          className="rounded-2xl border border-slate-800 bg-[#101827] p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600"
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">{stat.title}</p>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${colorStyles[stat.color]}`}
            >
              {stat.icon}
            </div>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            {stat.value}
          </h2>
          <p className={`mt-3 text-xs font-medium ${textStyles[stat.color]}`}>
            {stat.description}
          </p>
        </div>
      ))}
    </section>
  );
}

export default StatsCards;
