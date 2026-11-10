
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProfileHeader from "./components/profileHeader";
import ProfileStats from "./components/ProfileStats";
import userService from "../../services/userService";
import authStore from "../../store/authStore";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentBattles, setRecentBattles] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      userService.getProfile(),
      userService.getUserStats(),
      userService.getDashboard(),
    ])
      .then(([profileResponse, statsResponse, dashboardResponse]) => {
        if (!active) return;
        setUser(profileResponse.user);
        setStats(statsResponse.stats);
        setRecentBattles(dashboardResponse.dashboard.recentBattles);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleEditProfile = () => {
    setEditDisplayName(user.displayName || "");
    setEditBio(user.bio || "");
    setSaveError("");
    setShowEdit(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError("");

    try {
      const response = await userService.updateProfile({
        displayName: editDisplayName.trim() || null,
        bio: editBio.trim() || null,
      });
      const updatedUser = { ...user, ...response.user };
      setUser(updatedUser);
      authStore.setUser(updatedUser);
      setShowEdit(false);
    } catch (error) {
      setSaveError(error.message);
    }
  };

  const achievements = [
    stats?.wins > 0 && {
      icon: "🏆",
      title: "First Victory",
      description: "Won your first coding battle",
    },
    stats?.currentWinStreak >= 3 && {
      icon: "🔥",
      title: "On Fire",
      description: "Won 3 battles in a row",
    },
    stats?.totalBattles >= 25 && {
      icon: "⚔️",
      title: "Battle Veteran",
      description: "Completed 25 coding battles",
    },
    user?.rating >= 1400 && {
      icon: "⭐",
      title: "Rising Star",
      description: "Reached a rating of 1400",
    },
  ].filter(Boolean);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080b14] px-4 py-8 text-center text-slate-400">
        Loading your profile...
      </main>
    );
  }

  if (loadError || !user) {
    return (
      <main className="min-h-screen bg-[#080b14] px-4 py-8 text-center text-red-300">
        <p role="alert">
          Could not load your profile{loadError ? `: ${loadError}` : "."}
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 rounded-lg border border-slate-700 px-5 py-3 text-xs font-semibold text-slate-300"
        >
          Back to Dashboard
        </button>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b14] px-4 py-8 text-white md:px-8">

      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-blue-400">
              CODEARENA / PROFILE
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage your account and track your coding performance.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-700 px-5 py-3 text-xs font-semibold text-slate-300 transition hover:border-blue-500 hover:text-white"
          >
            ← Back to Dashboard
          </button>

        </div>

        {/* Profile Header Component */}
        <div className="mb-8">
          <ProfileHeader
            user={user}
            onEditProfile={handleEditProfile}
          />
        </div>

        {/* Edit Profile Form */}
        {showEdit && (
          <div className="mb-8 rounded-2xl border border-blue-500/30 bg-[#101827] p-6">

            <h2 className="mb-5 text-xl font-bold text-white">
              Edit Your Profile
            </h2>

            <form
              onSubmit={handleSaveProfile}
              className="space-y-5"
            >

              {/* Display name */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Display name
                </label>

                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#080b14] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {/* About Me */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  About Me
                </label>

                <textarea
                  rows="3"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-[#080b14] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {saveError && (
                <p role="alert" className="text-sm text-red-300">
                  Could not save your profile: {saveError}
                </p>
              )}

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Performance Statistics */}
        <div className="mb-10">
          <ProfileStats stats={stats} />
        </div>

        {/* About Me */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-[#101827] p-6">

          <h2 className="text-xl font-extrabold text-white">
            About Me
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            {user.bio || "No bio has been added yet."}
          </p>

        </section>

        {/* Achievements */}
        <section className="mb-10">

          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-white">
              Achievements
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Milestones earned through your coding battles
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {achievements.map((achievement) => (
              <div
                key={achievement.title}
                className="rounded-2xl border border-slate-800 bg-[#101827] p-5 transition duration-300 hover:-translate-y-1 hover:border-yellow-500/40"
              >

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-2xl">
                  {achievement.icon}
                </div>

                <h3 className="font-bold text-white">
                  {achievement.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {achievement.description}
                </p>

              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-sm text-slate-500">
                Keep competing to unlock achievements.
              </p>
            )}

          </div>
        </section>

        {/* Recent Battles */}
        <section className="mb-10 rounded-2xl border border-slate-800 bg-[#101827] p-6">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-xl font-extrabold text-white">
                Recent Battles
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your latest competitive matches
              </p>
            </div>

            <span className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400">
              Last {recentBattles.length} Battles
            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-137.5 text-left">

              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">

                  <th className="px-4 py-4">
                    Opponent
                  </th>

                  <th className="px-4 py-4">
                    Result
                  </th>

                  <th className="px-4 py-4">
                    Rating Change
                  </th>

                  <th className="px-4 py-4">
                    Date
                  </th>

                </tr>
              </thead>

              <tbody>
                {recentBattles.map((battle) => {
                  const ratingChange = Number(battle.ratingChange) || 0;
                  const resultLabel = {
                    WIN: "Won",
                    LOSS: "Lost",
                    DRAW: "Draw",
                  }[battle.result] || "Unknown";
                  const resultStyle =
                    battle.result === "WIN"
                      ? "bg-green-500/10 text-green-400"
                      : battle.result === "LOSS"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-slate-500/10 text-slate-300";
                  const ratingStyle =
                    ratingChange > 0
                      ? "text-green-400"
                      : ratingChange < 0
                        ? "text-red-400"
                        : "text-slate-400";

                  return (
                  <tr
                    key={battle.id}
                    className="border-b border-slate-800/60 last:border-0"
                  >

                    <td className="px-4 py-5 text-sm font-semibold text-white">
                      {battle.opponent?.username || "Opponent unavailable"}
                    </td>

                    <td className="px-4 py-5">
                      <span
                        className={`rounded-md px-3 py-1 text-xs font-bold ${resultStyle}`}
                      >
                        {resultLabel}
                      </span>
                    </td>

                    <td
                      className={`px-4 py-5 text-sm font-bold ${ratingStyle}`}
                    >
                      {ratingChange > 0 ? "+" : ""}
                      {ratingChange}
                    </td>

                    <td className="px-4 py-5 text-xs text-slate-500">
                      {battle.endedAt
                        ? new Date(battle.endedAt).toLocaleDateString()
                        : "Date unavailable"}
                    </td>

                  </tr>
                  );
                })}
                {recentBattles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      No completed battles yet.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>

          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-6 text-center">
          <p className="text-xs text-slate-600">
            CodeArena © 2026 | Think Fast. Code Smart. Win Together.
          </p>
        </footer>

      </div>
    </div>
  );
}

export default Profile;
