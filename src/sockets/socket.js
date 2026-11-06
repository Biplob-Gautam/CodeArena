
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "ws://localhost:5000";

let socket = null;
const listeners = new Map();

export function connectSocket() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return socket;
  }

  const token = localStorage.getItem("token");

  const url = new URL(SOCKET_URL);

  if (token) {
    url.searchParams.set("token", token);
  }

  socket = new WebSocket(url.toString());

  socket.onopen = () => {
    console.log("CodeArena socket connected");
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      const callbacks = listeners.get(message.event) || [];

      callbacks.forEach((callback) => callback(message.data));
    } catch (error) {
      console.error("Invalid socket message:", error);
    }
  };

  socket.onerror = (error) => {
    console.error("Socket error:", error);
  };

  socket.onclose = () => {
    console.log("CodeArena socket disconnected");
  };

  return socket;
}

export function emitSocket(event, data = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("Socket is not connected");
    return false;
  }

  socket.send(JSON.stringify({ event, data }));
  return true;
}

export function onSocket(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }

  listeners.get(event).push(callback);

  return () => {
    const callbacks = listeners.get(event) || [];
    listeners.set(
      event,
      callbacks.filter((item) => item !== callback)
    );
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }

  listeners.clear();
}

export function getSocket() {
  return socket;
}
