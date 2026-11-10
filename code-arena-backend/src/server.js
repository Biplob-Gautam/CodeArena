import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { disconnectRedis } from "./config/redis.js";
import { closeSubmissionQueue } from "./queues/submissionQueue.js";
import {
  closeSubmissionWorker,
  startSubmissionWorker,
} from "./queues/submissionWorker.js";
import { initializeSocket } from "./sockets/socket.js";
import {
  startBattleCompletionScheduler,
  stopBattleCompletionScheduler,
} from "./services/battleCompletionScheduler.js";

const port = Number(process.env.PORT || 5000);

await connectDatabase();
startSubmissionWorker();

const server = createServer(app);
const io = initializeSocket(server);
startBattleCompletionScheduler(io);

server.listen(port, () => {
  console.info(`Code Arena API listening on port ${port}.`);
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.info(`${signal} received. Shutting down...`);

  await stopBattleCompletionScheduler();
  await new Promise((resolve) => io.close(resolve));

  const shutdownSteps = [
    ["submission worker", closeSubmissionWorker],
    ["submission queue", closeSubmissionQueue],
    ["Redis", disconnectRedis],
    ["PostgreSQL", disconnectDatabase],
  ];
  for (const [resource, close] of shutdownSteps) {
    try {
      await close();
      console.info(`${resource} connection closed.`);
    } catch (closeError) {
      console.error(`Failed to close ${resource} cleanly.`, closeError);
      process.exitCode = 1;
    }
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));