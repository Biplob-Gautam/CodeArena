
import api from "./api";

const userService = {
  async getProfile() {
    return api.get("/users/me");
  },

  async updateProfile(profileData) {
    return api.put("/users/me", profileData);
  },

  async getUserStats() {
    return api.get("/users/me/stats");
  },

  async getDashboard() {
    return api.get("/dashboard");
  },

  async getUserById(userId) {
    return api.get(`/users/${userId}`);
  },

  async getLeaderboard() {
    return api.get("/leaderboard");
  },
};

export default userService;
