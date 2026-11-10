import { Queue, QueueEvents } from "bullmq";
import { redis } from "../config/redis.js";

export const SUBMISSION_QUEUE_NAME = "submission-evaluation";

export const submissionQueue = new Queue(SUBMISSION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2_000,
    },
  },
});

export const submissionQueueEvents = new QueueEvents(SUBMISSION_QUEUE_NAME, {
  connection: redis,
});

export async function enqueueSubmissionEvaluation(submissionId, metadata = {}) {
  if (typeof submissionId !== "string" || submissionId.trim().length === 0) {
    throw new TypeError("submissionId must be a non-empty string.");
  }

  return submissionQueue.add(
    "evaluate-submission",
    {
      submissionId,
      ...metadata,
    },
    {
      jobId: `submission:${submissionId}`,
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2_000,
      },
    },
  );
}

export async function getSubmissionQueueStats() {
  return submissionQueue.getJobCounts();
}

export async function closeSubmissionQueue() {
  const results = await Promise.allSettled([
    submissionQueueEvents.close(),
    submissionQueue.close(),
  ]);
  const errors = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
  if (errors.length > 0) {
    throw new AggregateError(errors, "Failed to close submission queue resources.");
  }
}

export default submissionQueue;
