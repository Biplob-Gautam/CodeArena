
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ProfileHeader from "./components/profileHeader";
import ProfileStats from "./components/ProfileStats";

function Profile() {
  const navigate = useNavigate();

  // User Information
  const [user, setUser] = useState({
    username: "Sagnik",
    email: "sagnik@example.com",
    joinedDate: "January 2026",
    rating: 1420,
    rank: 256,
    level: "Intermediate",
    about:
      "Passionate programmer who loves solving challenging problems and competing with developers. Always learning and improving my coding skills."
  });

  // Profile Statistics
  const stats = {
    totalBattles: 48,
    wins: 32,
    losses: 16,
    winRate: 66.7,
    streak: 4,
    bestRating: 1580
  };

  // Edit Profile States
  const [showEdit, setShowEdit] = useState(false);
  const [editUsername, setEditUsername] = useState(user.username);
  const [editAbout, setEditAbout] = useState(user.about);

  // Recent Battles
  const recentBattles = [
    {
      opponent: "CodeNinja",
      result: "Won",
      rating: "+25",
      date: "Today"
    },
    {
      opponent: "DevMaster",
      result: "Lost",
      rating: "-12",
      date: "Yesterday"
    },
    {
      opponent: "AlgoKing",
      result: "Won",
      rating: "+20",
      date: "2 days ago"
    },
    {
      opponent: "ByteHunter",
      result: "Won",
      rating: "+18",
      date: "3 days ago"
    }
  ];

  // Achievements
  const achievements = [
    {
      icon: "🏆",
      title: "First Victory",
      description: "Won your first coding battle"
    },
    {
      icon: "🔥",
      title: "On Fire",
      description: "Won 4 battles consecutively"
    },
    {
      icon: "⚔️",
      title: "Battle Veteran",
      description: "Completed 40+ battles"
    },
    {
      icon: "⭐",
      title: "Rising Star",
      description: "Reached 1500 Elo rating"
    }
  ];

  // Open Edit Profile
  const handleEditProfile = () => {
    setEditUsername(user.username);
    setEditAbout(user.about);
    setShowEdit(true);
  };

  // Save Profile Changes
  const handleSaveProfile = (e) => {
    e.preventDefault();

    if (!editUsername.trim()) return;

    setUser((previous) => ({
      ...previous,
      username: editUsername.trim(),
      about: editAbout.trim()
    }));

    setShowEdit(false);
  };

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

              {/* Username */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Username
                </label>

                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#080b14] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                  required
                />
              </div>

              {/* About Me */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  About Me
                </label>

                <textarea
                  rows="3"
                  value={editAbout}
                  onChange={(e) => setEditAbout(e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-[#080b14] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

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
            {user.about}
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

            {achievements.map((achievement, index) => (
              <div
                key={index}
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
              Last 4 Battles
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
                {recentBattles.map((battle, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-800/60 last:border-0"
                  >

                    <td className="px-4 py-5 text-sm font-semibold text-white">
                      {battle.opponent}
                    </td>

                    <td className="px-4 py-5">
                      <span
                        className={`rounded-md px-3 py-1 text-xs font-bold ${
                          battle.result === "Won"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {battle.result}
                      </span>
                    </td>

                    <td
                      className={`px-4 py-5 text-sm font-bold ${
                        battle.rating.startsWith("+")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {battle.rating}
                    </td>

                    <td className="px-4 py-5 text-xs text-slate-500">
                      {battle.date}
                    </td>

                  </tr>
                ))}
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
