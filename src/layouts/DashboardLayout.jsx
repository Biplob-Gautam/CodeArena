
import { NavLink, useNavigate } from "react-router-dom";

function DashboardLayout({ children }) {
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "⌂" },
    { name: "Matchmaking", path: "/matchmaking", icon: "⚔" },
    { name: "Profile", path: "/profile", icon: "◉" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#080b14] text-white">

      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-[#101827] md:flex">

        {/* Logo */}
        <div className="flex h-20 items-center gap-2 border-b border-slate-800 px-6">
          <span className="text-2xl font-bold text-blue-400">
            &lt;/&gt;
          </span>

          <span className="text-xl font-bold">
            CodeArena
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Menu
          </p>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            ↪ Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top Navbar */}
        <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-[#101827] px-4 sm:px-6 lg:px-8">

          <div>
            <h2 className="text-lg font-semibold">
              Welcome to CodeArena
            </h2>
            <p className="hidden text-xs text-slate-400 sm:block">
              Improve your skills. Challenge developers.
            </p>
          </div>

          <button
            onClick={() => navigate("/profile")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-bold text-white"
            title="View Profile"
          >
            S
          </button>
        </header>

        {/* Mobile Navigation */}
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-800 bg-[#101827] p-3 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

export default DashboardLayout;
