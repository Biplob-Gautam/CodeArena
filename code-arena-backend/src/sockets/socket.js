import { Server } from "socket.io";
import { prisma } from "../config/database.js";
import { verifyAccessToken } from "../config/jwt.js";
import { registerBattleSocketHandlers } from "./battleSocket.js";
import { registerMatchmakingSocketHandlers } from "./matchmakingSocket.js";

const connectedUsers = new Map();

function extractToken(socket) {
  const handShakeAuthToken = socket.handshake?.auth?.token;
  const queryToken = socket.handshake?.query?.token;
  const authorizationHeader = socket.handshake?.headers?.authorization;

  const candidate =
    typeof handShakeAuthToken === "string"
      ? handShakeAuthToken
      : Array.isArray(handShakeAuthToken)
        ? handShakeAuthToken[0]
        : typeof queryToken === "string"
          ? queryToken
          : Array.isArray(queryToken)
            ? queryToken[0]
            : typeof authorizationHeader === "string"
              ? authorizationHeader
              : Array.isArray(authorizationHeader)
                ? authorizationHeader[0]
                : null;

  if (typeof candidate !== "string") {
    return null;
  }

  return candidate.startsWith("Bearer ") ? candidate.slice(7) : candidate;
}

async function authenticateSocket(socket, next) {
  const token = extractToken(socket);

  if (!token) {
    return next(new Error("Authentication token is required."));
  }

  try {
    const payload = verifyAccessToken(token);

    if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") {
      return next(new Error("Invalid access token payload."));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        rating: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new Error("User account is unavailable."));
    }

    socket.data.user = user;
    return next();
  } catch {
    return next(new Error("Authentication failed."));
  }
}

export function createSocketServer(server, options = {}) {
  const io = new Server(server, {
    path: options.path ?? "/socket.io",
    serveClient: false,
    transports: ["websocket", "polling"],
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
      ...(options.cors ?? {}),
    },
    ...options,
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    connectedUsers.set(socket.id, user.id);

    socket.join(`user:${user.id}`);
    socket.emit("connected", {
      userId: user.id,
      username: user.username,
      connectedAt: new Date().toISOString(),
    });

    registerMatchmakingSocketHandlers(io, socket);
    registerBattleSocketHandlers(io, socket);

    let battleRooms = [];
    socket.on("disconnecting", () => {
      battleRooms = [...socket.rooms].filter((room) => room.startsWith("battle:"));
    });

    socket.on("disconnect", (reason) => {
      connectedUsers.delete(socket.id);
      void Promise.all(
        battleRooms.map(async (room) => {
          const remainingSockets = await io.in(room).fetchSockets();
          const userStillPresent = remainingSockets.some(
            (remainingSocket) => remainingSocket.data.user?.id === user.id,
          );
          if (!userStillPresent) {
            io.to(room).emit("battle:presence", {
              battleId: room.slice("battle:".length),
              userId: user.id,
              username: user.username,
              online: false,
              reason,
            });
          }
        }),
      ).catch((error) => {
        console.error("Failed to update battle presence after disconnect:", error);
      });
    });
  });

  return io;
}

export function initializeSocket(server, options = {}) {
  return createSocketServer(server, options);
}

export function initSocket(server, options = {}) {
  return createSocketServer(server, options);
}

export function attachSocket(server, options = {}) {
  return createSocketServer(server, options);
}

export function emitToUser(io, userId, event, payload = {}) {
  io.to(`user:${userId}`).emit(event, payload);
}

export function isUserConnected(userId) {
  return [...connectedUsers.values()].includes(userId);
}

export function getConnectedUsers() {
  return [...new Set(connectedUsers.values())];
}

export default {
  createSocketServer,
  initializeSocket,
  initSocket,
  attachSocket,
  emitToUser,
  isUserConnected,
  getConnectedUsers,
};
