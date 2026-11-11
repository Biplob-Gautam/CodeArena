import { io } from "socket.io-client";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_BASE_URL.replace(/\/api\/?$/, "");

let socket = null;

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function connectSocket() {
  const token = getToken();

  if (socket && socket.auth.token !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token },
      transports: ["websocket", "polling"],
    });
  }

  if (!socket.connected && !socket.active) {
    socket.connect();
  }

  return socket;
}

export function emitSocket(event, data = {}) {
  if (!socket) return false;
  socket.emit(event, data);
  return true;
}

export function onSocket(event, callback) {
  if (!socket) {
    throw new Error("Connect the socket before registering event listeners.");
  }

  socket.on(event, callback);
  return () => socket?.off(event, callback);
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
