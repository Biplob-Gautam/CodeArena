
const initialState = {
  user: null,
  token: localStorage.getItem("token") || sessionStorage.getItem("token"),
  isAuthenticated: Boolean(
    localStorage.getItem("token") || sessionStorage.getItem("token"),
  ),
};

let state = { ...initialState };

const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener(state));
}

const authStore = {
  getState() {
    return state;
  },

  subscribe(listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },

  setUser(user) {
    state = {
      ...state,
      user,
    };

    notify();
  },

  setToken(token) {
    if (token) {
      localStorage.setItem("token", token);
      sessionStorage.removeItem("token");
    } else {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }

    state = {
      ...state,
      token,
      isAuthenticated: Boolean(token),
    };

    notify();
  },

  login(user, token, rememberMe = true) {
    if (token) {
      if (rememberMe) {
        localStorage.setItem("token", token);
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", token);
        localStorage.removeItem("token");
      }
    }

    state = {
      user,
      token: token || state.token,
      isAuthenticated: Boolean(token || state.token),
    };

    notify();
  },

  logout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    state = {
      user: null,
      token: null,
      isAuthenticated: false,
    };

    notify();
  },
};

export default authStore;
