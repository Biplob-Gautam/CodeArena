
import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import authStore from "../../store/authStore";
import userService from "../../services/userService";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import WelcomeSection from "./components/WelcomeSection";
import StatsCards from "./components/StatsCards";
import RatingCard from "./components/RatingCard";
import RecentBattles from "./components/RecentBattles";
import QuickActions from "./components/QuickActions";

function Dashboard() {
  const navigate = useNavigate();
  const auth = useSyncExternalStore(authStore.subscribe, authStore.getState);

  const [activePage, setActivePage] = useState("Dashboard");
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    userService
      .getDashboard()
      .then((response) => {
        if (active) setDashboard(response.dashboard);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const username =
    auth.user?.displayName || auth.user?.username || "Player";

  const handleNavigation = (page) => {
    setActivePage(page);

    if (page === "Dashboard") {
      return;
    }

    if (page === "Battle Arena") {
      setShowBattleModal(true);
      return;
    }

    alert(`${page} page will be implemented soon!`);
  };

  return (
    <div className="flex min-h-screen bg-[#080b14] text-white">

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigation}
      />

      {/* Main Dashboard */}
      <div className="min-w-0 flex-1">

        {/* Navbar */}
        <Navbar />

        <main className="mx-auto max-w-400 space-y-7 p-5 md:p-8">

          {/* Page Heading */}
          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-500">
                OVERVIEW / DASHBOARD
              </p>

              <h1 className="text-2xl font-extrabold text-white">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Ready to compete
            </div>

          </div>

          {/* Welcome Section */}
          <WelcomeSection
            username={username}
            onStartBattle={() => setShowBattleModal(true)}
          />

          {loadError && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              Could not load your dashboard: {loadError}
            </p>
          )}

          {/* Performance Heading */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Your Performance
              </h2>
            </div>

            <p className="text-xs text-slate-500">
              Track your progress and competitive journey.
            </p>
          </div>

          {/* Statistics */}
          <StatsCards stats={dashboard?.stats} user={dashboard?.user} />

          {/* Rating and Quick Actions */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

            <RatingCard user={dashboard?.user} />

            <QuickActions
              onStartBattle={() => setShowBattleModal(true)}
            />

          </div>

          {/* Recent Battles */}
          <RecentBattles
            battles={dashboard?.recentBattles}
            loading={!dashboard && !loadError}
          />

          {/* Footer */}
          <footer className="flex flex-col justify-between gap-3 border-t border-slate-800 pt-5 text-[10px] text-slate-500 sm:flex-row">
            <p>
              © 2026 CodeArena. All rights reserved.
            </p>

            <p>
              Think Fast. Code Smart. Win Together.
            </p>
          </footer>

        </main>
      </div>

      {/* Battle Modal */}
      {showBattleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowBattleModal(false)}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="battle-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#101827] p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Close Button */}
            <button
              onClick={() => setShowBattleModal(false)}
              className="absolute right-5 top-4 text-2xl text-slate-500 hover:text-white"
            >
              ×
            </button>

            {/* Modal Content */}
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl text-blue-400">
              ⚔
            </div>

            <p className="mb-2 text-[10px] font-bold tracking-widest text-blue-400">
              BATTLE ARENA
            </p>

            <h2
              id="battle-title"
              className="text-2xl font-bold text-white"
            >
              Ready for a Challenge?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Match with a programmer of similar skill level and
              compete in a real-time coding battle.
            </p>

            {/* Battle Information */}
            <div className="mt-7 space-y-4">

              <div className="flex justify-between border-b border-slate-700 pb-3 text-sm">
                <span className="text-slate-400">
                  Match Type
                </span>

                <span className="font-semibold text-white">
                  1 vs 1
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-700 pb-3 text-sm">
                <span className="text-slate-400">
                  Difficulty
                </span>

                <span className="font-semibold text-white">
                  Skill Based
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  Rating System
                </span>

                <span className="font-semibold text-white">
                  Elo Rating
                </span>
              </div>

            </div>

            {/* Find Opponent */}
            <button
              onClick={() => {
                setShowBattleModal(false);
                navigate("/matchmaking");
              }}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Find Opponent →
            </button>

            <button
              onClick={() => setShowBattleModal(false)}
              className="mt-4 w-full text-xs font-medium text-slate-500 hover:text-white"
            >
              Maybe Later
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
