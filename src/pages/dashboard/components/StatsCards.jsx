
const stats = [
  {
    title: "Battles Played",
    value: "48",
    description: "+12 this week",
    icon: "⚔",
    color: "blue",
  },
  {
    title: "Victories",
    value: "32",
    description: "Great progress!",
    icon: "♛",
    color: "green",
  },
  {
    title: "Win Rate",
    value: "66.7%",
    description: "+4.2% this month",
    icon: "↗",
    color: "purple",
  },
  {
    title: "Current Rating",
    value: "1,420",
    description: "Gold League",
    icon: "✦",
    color: "orange",
  },
];

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

function StatsCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-2xl border border-slate-800 bg-[#101827] p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-600"
        >

          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">
              {stat.title}
            </p>

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
