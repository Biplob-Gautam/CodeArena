import { cancelMatch, findMatch } from "../services/matchmakingService.js";

export async function queueForMatch(io, socket) {
  const user = socket.data.user;
  const result = await findMatch(user.id);

  if (result.status === "MATCHED") {
    const battle = result.battle;
    for (const participant of battle.participants ?? []) {
      io.to(`user:${participant.user.id}`).emit("matchmaking:matched", {
        battle,
        status: "MATCHED",
      });
    }
    return result;
  }

  io.to(`user:${user.id}`).emit("matchmaking:waiting", {
    battle: result.battle,
    status: result.status,
    message: "Matchmaking request is pending.",
  });

  return result;
}

export async function cancelQueue(socket) {
  const user = socket.data.user;
  const cancelled = await cancelMatch(user.id);

  return cancelled;
}

export function registerMatchmakingSocketHandlers(io, socket) {
  const user = socket.data.user;

  socket.on("matchmaking:find", async () => {
    try {
      const result = await queueForMatch(io, socket);
      socket.emit("matchmaking:status", {
        userId: user.id,
        status: result.status,
        battle: result.battle,
      });
    } catch (error) {
      socket.emit("matchmaking:error", {
        message: error?.message ?? "Unable to find a match.",
      });
    }
  });

  socket.on("matchmaking:join", async () => {
    try {
      const result = await queueForMatch(io, socket);
      socket.emit("matchmaking:status", {
        userId: user.id,
        status: result.status,
        battle: result.battle,
      });
    } catch (error) {
      socket.emit("matchmaking:error", {
        message: error?.message ?? "Unable to join the queue.",
      });
    }
  });

  socket.on("matchmaking:cancel", async () => {
    try {
      const cancelled = await cancelQueue(socket);
      socket.emit("matchmaking:cancelled", {
        userId: user.id,
        cancelled,
      });
    } catch (error) {
      socket.emit("matchmaking:error", {
        message: error?.message ?? "Unable to cancel the queue.",
      });
    }
  });

  socket.on("matchmaking:leave", async () => {
    try {
      const cancelled = await cancelQueue(socket);
      socket.emit("matchmaking:cancelled", {
        userId: user.id,
        cancelled,
      });
    } catch (error) {
      socket.emit("matchmaking:error", {
        message: error?.message ?? "Unable to leave the queue.",
      });
    }
  });
}

export function emitMatchmakingStatus(io, userId, status, payload = {}) {
  io.to(`user:${userId}`).emit("matchmaking:status", {
    userId,
    status,
    ...payload,
  });
}

export default {
  queueForMatch,
  cancelQueue,
  registerMatchmakingSocketHandlers,
  emitMatchmakingStatus,
};
