
const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: Boolean(localStorage.getItem("token")),
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
    } else {
      localStorage.removeItem("token");
    }

    state = {
      ...state,
      token,
      isAuthenticated: Boolean(token),
    };

    notify();
  },

  login(user, token) {
    if (token) {
      localStorage.setItem("token", token);
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

    state = {
      user: null,
      token: null,
      isAuthenticated: false,
    };

    notify();
  },
};

export default authStore;
