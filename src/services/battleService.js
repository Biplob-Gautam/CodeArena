
import api from "./api";

const battleService = {
  async findMatch() {
    return api.post("/matchmaking/find", {});
  },

  async cancelMatch() {
    return api.post("/matchmaking/cancel", {});
  },

  async getBattle(battleId) {
    return api.get(`/battles/${battleId}`);
  },

  async submitCode(battleId, submission) {
    return api.post(`/battles/${battleId}/submit`, submission);
  },

  async getBattleResult(battleId) {
    return api.get(`/battles/${battleId}/result`);
  },

  async getBattleHistory() {
    return api.get("/battles/history");
  },

  async getLeaderboard() {
    return api.get("/leaderboard");
  },
};

export default battleService;
