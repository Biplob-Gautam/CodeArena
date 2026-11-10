import { Worker } from "bullmq";
import { prisma } from "../config/database.js";
import { redis } from "../config/redis.js";
import {
  evaluateSubmission,
  pollSubmission,
} from "../services/submissionService.js";
import { SUBMISSION_QUEUE_NAME } from "./submissionQueue.js";

const MAX_EVALUATION_TIME_MS = 120_000;
let submissionWorker;

export function startSubmissionWorker() {
  if (submissionWorker) return submissionWorker;

  submissionWorker = new Worker(
    SUBMISSION_QUEUE_NAME,
    async (job) => {
      const { submissionId } = job.data ?? {};

      if (typeof submissionId !== "string" || submissionId.trim().length === 0) {
        throw new Error("A valid submissionId is required to process a submission.");
      }

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { status: true },
      });
      if (!submission) {
        throw new Error(`Submission ${submissionId} no longer exists.`);
      }
      if (submission.status !== "QUEUED" && submission.status !== "PROCESSING") {
        return { submissionId, status: submission.status };
      }
      if (submission.status === "QUEUED") {
        await evaluateSubmission(submissionId);
      }

      const deadline = Date.now() + MAX_EVALUATION_TIME_MS;
      while (Date.now() < deadline) {
        const result = await pollSubmission(submissionId);
        if (result.status !== "PROCESSING") {
          return { submissionId, status: result.status };
        }

        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }

      throw new Error(
        `Judge evaluation for submission ${submissionId} exceeded ${MAX_EVALUATION_TIME_MS}ms.`,
      );
    },
    {
      connection: redis,
      concurrency: 2,
    },
  );

  submissionWorker.on("error", (error) => {
    console.error("Submission worker error:", error);
  });

  submissionWorker.on("failed", (job, error) => {
    console.error(`Submission job ${job?.id ?? "unknown"} failed:`, error);
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;

    void prisma.submission.updateMany({
      where: {
        id: job.data?.submissionId,
        status: { in: ["QUEUED", "PROCESSING"] },
      },
      data: { status: "INTERNAL_ERROR", evaluatedAt: new Date() },
    }).catch((updateError) => {
      console.error(
        `Failed to mark submission ${job.data?.submissionId ?? "unknown"} after exhausted retries:`,
        updateError,
      );
    });
  });

  return submissionWorker;
}

export async function closeSubmissionWorker() {
  if (!submissionWorker) return;
  const worker = submissionWorker;
  submissionWorker = undefined;
  await worker.close();
}

export default startSubmissionWorker;
