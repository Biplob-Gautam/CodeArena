
const menuItems = [
  { name: "Dashboard", icon: "▦" },
  { name: "Battle Arena", icon: "⚔", badge: "LIVE" },
  { name: "Problems", icon: "⌘" },
  { name: "Leaderboard", icon: "♜" },
  { name: "Battle History", icon: "◷" },
];

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col border-r border-slate-800 bg-[#0b101c] px-4 py-6 lg:flex">

      {/* Logo */}
      <div className="mb-12 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 font-bold text-white">
          {"</>"}
        </div>

        <h1 className="text-xl font-extrabold text-white">
          Code<span className="text-blue-400">Arena</span>
        </h1>
      </div>

      {/* Main Menu */}
      <div>
        <p className="mb-4 px-3 text-[10px] font-bold tracking-[2px] text-slate-500">
          MAIN MENU
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.name)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                activePage === item.name
                  ? "border border-blue-500/20 bg-blue-500/10 font-semibold text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="w-6 text-center text-lg">
                {item.icon}
              </span>

              <span className="flex-1">
                {item.name}
              </span>

              {item.badge && (
                <span className="rounded-md bg-green-500/10 px-2 py-1 text-[9px] font-bold text-green-400">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Preferences */}
      <div className="mt-10">
        <p className="mb-4 px-3 text-[10px] font-bold tracking-[2px] text-slate-500">
          PREFERENCES
        </p>

        <button
          onClick={() => onNavigate("Settings")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
            activePage === "Settings"
              ? "bg-blue-500/10 text-blue-400"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="w-6 text-center text-lg">⚙</span>
          Settings
        </button>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto">

        <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-blue-500/10 to-violet-500/10 p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            ✦
          </div>

          <h3 className="mb-2 text-sm font-bold text-white">
            Keep Improving!
          </h3>

          <p className="text-xs leading-5 text-slate-400">
            Every battle brings you one step closer to mastering coding.
          </p>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
          </div>

          <p className="mt-2 text-[10px] text-slate-500">
            Consistency is the key.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2 px-2 text-[10px] text-slate-500">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          All systems operational
        </div>

      </div>
    </aside>
  );
}

export default Sidebar;
