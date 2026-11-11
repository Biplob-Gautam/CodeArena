
import api from "./api";

const authService = {
  async login(credentials, { rememberMe = true } = {}) {
    const data = await api.post("/auth/login", credentials);

    if (data.token && rememberMe) {
      localStorage.setItem("token", data.token);
      sessionStorage.removeItem("token");
    } else if (data.token) {
      sessionStorage.setItem("token", data.token);
      localStorage.removeItem("token");
    }

    return data;
  },

  async register(userData) {
    const data = await api.post("/auth/register", userData);
    if (data.token) {
      localStorage.setItem("token", data.token);
      sessionStorage.removeItem("token");
    }
    return data;
  },

  async logout() {
    try {
      await api.post("/auth/logout", {});
    } finally {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  },

  async getCurrentUser() {
    return api.get("/auth/me");
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"));
  },
};

export default authService;
