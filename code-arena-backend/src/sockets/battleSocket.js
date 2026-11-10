import { prisma } from "../config/database.js";

const battleSelect = {
  id: true,
  status: true,
  startsAt: true,
  endsAt: true,
  durationSeconds: true,
  createdAt: true,
  problem: {
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      description: true,
      inputFormat: true,
      outputFormat: true,
      constraints: true,
      examples: true,
      timeLimitMs: true,
      memoryLimitMb: true,
    },
  },
  participants: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          rating: true,
          ratingDeviation: true,
        },
      },
    },
  },
};

export async function getBattleForSocket(userId, battleId) {
  if (!battleId || typeof battleId !== "string") {
    throw new Error("A valid battle ID is required.");
  }

  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: battleSelect,
  });

  if (!battle) {
    throw new Error("Battle not found.");
  }

  const isParticipant = battle.participants.some(
    (participant) => participant.userId === userId,
  );

  if (!isParticipant) {
    throw new Error("You are not a participant in this battle.");
  }

  return battle;
}

export async function joinBattleRoom(io, socket, battleId) {
  const user = socket.data.user;
  const battle = await getBattleForSocket(user.id, battleId);

  socket.join(`battle:${battle.id}`);

  const connectedParticipants = await io.in(`battle:${battle.id}`).fetchSockets();
  const presenceByUser = new Map(
    connectedParticipants.map((participantSocket) => [
      participantSocket.data.user.id,
      participantSocket.data.user,
    ]),
  );
  for (const [userId, participant] of presenceByUser) {
    io.to(`battle:${battle.id}`).emit("battle:presence", {
      battleId: battle.id,
      userId,
      username: participant.username,
      online: true,
    });
  }

  socket.emit("battle:joined", {
    battleId: battle.id,
    battle,
  });

  return battle;
}

export async function leaveBattleRoom(io, socket, battleId) {
  const user = socket.data.user;
  const battle = await getBattleForSocket(user.id, battleId);

  socket.leave(`battle:${battle.id}`);

  const remainingSockets = await io.in(`battle:${battle.id}`).fetchSockets();
  const userStillPresent = remainingSockets.some(
    (remainingSocket) => remainingSocket.data.user?.id === user.id,
  );
  if (!userStillPresent) {
    io.to(`battle:${battle.id}`).emit("battle:presence", {
      battleId: battle.id,
      userId: user.id,
      username: user.username,
      online: false,
    });
  }

  socket.emit("battle:left", {
    battleId: battle.id,
    battle,
  });

  return battle;
}

export function registerBattleSocketHandlers(io, socket) {
  const user = socket.data.user;

  socket.on("battle:join", async (payload = {}) => {
    const battleId = payload.battleId ?? payload.id;

    try {
      const battle = await joinBattleRoom(io, socket, battleId);
      socket.emit("battle:state", {
        battleId: battle.id,
        battle,
      });
    } catch (error) {
      socket.emit("battle:error", {
        userId: user.id,
        message: error?.message ?? "Unable to join the battle.",
      });
    }
  });

  socket.on("battle:leave", async (payload = {}) => {
    const battleId = payload.battleId ?? payload.id;

    try {
      const battle = await leaveBattleRoom(io, socket, battleId);
      socket.emit("battle:state", {
        battleId: battle.id,
        battle,
      });
    } catch (error) {
      socket.emit("battle:error", {
        userId: user.id,
        message: error?.message ?? "Unable to leave the battle.",
      });
    }
  });

  socket.on("battle:sync", async (payload = {}) => {
    const battleId = payload.battleId ?? payload.id;

    try {
      const battle = await getBattleForSocket(user.id, battleId);
      socket.emit("battle:state", {
        battleId: battle.id,
        battle,
      });
    } catch (error) {
      socket.emit("battle:error", {
        userId: user.id,
        message: error?.message ?? "Unable to sync battle state.",
      });
    }
  });

}

export function emitBattleUpdate(io, battleId, payload = {}) {
  io.to(`battle:${battleId}`).emit("battle:update", {
    battleId,
    ...payload,
  });
}

export default {
  getBattleForSocket,
  joinBattleRoom,
  leaveBattleRoom,
  registerBattleSocketHandlers,
  emitBattleUpdate,
};
