
const initialState = {
  battle: null,
  opponent: null,
  status: "idle",
  code: "",
  language: "javascript",
  submission: null,
  result: null,
};

let state = { ...initialState };

const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener(state));
}

const battleStore = {
  getState() {
    return state;
  },

  subscribe(listener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },

  setBattle(battle) {
    state = {
      ...state,
      battle,
      status: "active",
    };

    notify();
  },

  setOpponent(opponent) {
    state = {
      ...state,
      opponent,
    };

    notify();
  },

  setStatus(status) {
    state = {
      ...state,
      status,
    };

    notify();
  },

  setCode(code) {
    state = {
      ...state,
      code,
    };

    notify();
  },

  setLanguage(language) {
    state = {
      ...state,
      language,
    };

    notify();
  },

  setSubmission(submission) {
    state = {
      ...state,
      submission,
    };

    notify();
  },

  setResult(result) {
    state = {
      ...state,
      result,
      status: "completed",
    };

    notify();
  },

  reset() {
    state = { ...initialState };
    notify();
  },
};

export default battleStore;
