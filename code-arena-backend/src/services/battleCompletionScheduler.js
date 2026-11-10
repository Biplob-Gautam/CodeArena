import { prisma } from "../config/database.js";
import { completeBattle } from "./battleService.js";

const DEFAULT_INTERVAL_MS = 5_000;
let interval;
let activePass;

export async function runBattleCompletionPass(io) {
  const now = Date.now();
  const battles = await prisma.battle.findMany({
    where: {
      OR: [
        { status: "IN_PROGRESS", startsAt: { not: null } },
        {
          status: "COMPLETED",
          ratingHistories: { none: {} },
        },
      ],
    },
    select: {
      id: true,
      status: true,
      startsAt: true,
      durationSeconds: true,
      participants: { select: { userId: true } },
    },
    orderBy: { startsAt: "asc" },
    take: 500,
  });

  for (const battle of battles) {
    const expired =
      battle.status === "COMPLETED" ||
      (battle.startsAt &&
        battle.startsAt.getTime() + battle.durationSeconds * 1000 <= now);
    if (!expired) continue;

    try {
      const completion = await completeBattle(battle.id);
      if (completion.completedNow) {
        for (const participant of battle.participants) {
          io.to(`user:${participant.userId}`).emit("battle:completed", {
            battleId: battle.id,
            status: completion.status,
          });
        }
      }
    } catch (error) {
      if (
        error?.statusCode !== 409 ||
        error.message !==
          "Battle completion is waiting for submitted solutions to finish judging."
      ) {
        console.error(`Failed to complete battle ${battle.id}:`, error);
      }
    }
  }
}

export function startBattleCompletionScheduler(io, intervalMs = DEFAULT_INTERVAL_MS) {
  if (interval) return stopBattleCompletionScheduler;

  const run = () => {
    if (activePass) return;
    activePass = runBattleCompletionPass(io)
      .catch((error) => {
        console.error("Battle completion scheduler failed:", error);
      })
      .finally(() => {
        activePass = undefined;
      });
  };

  run();
  interval = setInterval(run, intervalMs);
  interval.unref?.();
  return stopBattleCompletionScheduler;
}

export async function stopBattleCompletionScheduler() {
  if (interval) {
    clearInterval(interval);
    interval = undefined;
  }
  await activePass;
}

export default {
  runBattleCompletionPass,
  startBattleCompletionScheduler,
  stopBattleCompletionScheduler,
};
