
import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../../services/authService";
import authStore from "../../../store/authStore";

function Navbar() {
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const auth = useSyncExternalStore(authStore.subscribe, authStore.getState);

  useEffect(() => {
    if (!auth.token || auth.user) return;

    let active = true;
    authService
      .getCurrentUser()
      .then(({ user }) => {
        if (active) authStore.setUser(user);
      })
      .catch((error) => {
        console.error("Could not load the current user:", error);
      });

    return () => {
      active = false;
    };
  }, [auth.token, auth.user]);

  const username =
    auth.user?.displayName || auth.user?.username || "CodeArena player";
  const email = auth.user?.email || "";

  const handleLogout = () => {
    authService
      .logout()
      .catch((error) => {
        console.error("Server logout failed; clearing the local session:", error);
      })
      .finally(() => {
        authStore.logout();
        navigate("/login", { replace: true });
      });
  };

  return (
    <header className="sticky top-0 z-40 flex h-18.75 items-center justify-between border-b border-slate-800 bg-[#0b101c]/95 px-5 backdrop-blur-xl md:px-8">

      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 font-bold text-white">
          {"</>"}
        </div>

        <h1 className="text-lg font-extrabold text-white md:text-xl">
          Code<span className="text-blue-400">Arena</span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="hidden w-full max-w-sm items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 md:flex">
        <span className="text-xl text-slate-500">⌕</span>

        <input
          type="text"
          placeholder="Search problems, players..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />

        <span className="whitespace-nowrap rounded border border-slate-700 px-2 py-1 text-xs text-slate-500">
          Ctrl K
        </span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 md:gap-5">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-lg text-slate-300 hover:border-blue-500"
          >
            ♧

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 w-64 rounded-xl border border-slate-700 bg-[#111827] p-4 shadow-2xl">
              <h3 className="mb-3 text-sm font-bold text-white">
                Notifications
              </h3>

              <p className="text-xs text-slate-400">
                You're all caught up! No new notifications.
              </p>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </div>

            <span className="hidden max-w-28 truncate text-sm font-medium text-slate-200 sm:block">
              {username}
            </span>

            <span className="text-slate-500">⌄</span>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-14 w-52 rounded-xl border border-slate-700 bg-[#111827] p-2 shadow-2xl">

              <div className="border-b border-slate-700 px-3 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {username}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10"
              >
                ↪ Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Navbar;
