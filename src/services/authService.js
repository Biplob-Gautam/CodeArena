
import api from "./api";

const authService = {
  async login(credentials) {
    const data = await api.post("/auth/login", credentials);

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    return data;
  },

  async register(userData) {
    return api.post("/auth/register", userData);
  },

  async logout() {
    try {
      await api.post("/auth/logout", {});
    } finally {
      localStorage.removeItem("token");
    }
  },

  async getCurrentUser() {
    return api.get("/auth/me");
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem("token"));
  },
};

export default authService;
