import { prisma } from "../config/database.js";
import { enqueueSubmissionEvaluation } from "../queues/submissionQueue.js";
import ApiError from "../utils/ApiError.js";

export async function submitCode(req, res) {
  const { battleId } = req.params;
  const { language, sourceCode } = req.body ?? {};

  if (typeof language !== "string" || language.trim().length === 0 || language.length > 40) {
    throw new ApiError(400, "A supported programming language is required.");
  }
  if (
    typeof sourceCode !== "string" ||
    sourceCode.trim().length === 0 ||
    Buffer.byteLength(sourceCode, "utf8") > 100_000
  ) {
    throw new ApiError(400, "Source code must be non-empty and no larger than 100 KB.");
  }

  const submission = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Battle" WHERE id = ${battleId} FOR UPDATE`;
    const participant = await tx.battleParticipant.findFirst({
      where: {
        battleId,
        userId: req.user.id,
        battle: { status: "IN_PROGRESS" },
      },
      include: { battle: { select: { startsAt: true, durationSeconds: true } } },
    });
    if (!participant) {
      throw new ApiError(404, "Active battle participation was not found.");
    }

    const deadline = participant.battle.startsAt
      ? participant.battle.startsAt.getTime() +
        participant.battle.durationSeconds * 1000
      : 0;
    if (!deadline || Date.now() >= deadline) {
      throw new ApiError(409, "The battle has ended; submissions are no longer accepted.");
    }

    const created = await tx.submission.create({
      data: {
        participantId: participant.id,
        language: language.trim(),
        sourceCode,
        status: "QUEUED",
      },
      select: {
        id: true,
        language: true,
        status: true,
        submittedAt: true,
      },
    });
    await tx.battleParticipant.update({
      where: { id: participant.id },
      data: { totalSubmissions: { increment: 1 } },
    });
    return created;
  });

  try {
    await enqueueSubmissionEvaluation(submission.id);
  } catch (error) {
    console.error(`Failed to enqueue submission ${submission.id}:`, error);
    try {
      await prisma.submission.updateMany({
        where: { id: submission.id, status: "QUEUED" },
        data: { status: "INTERNAL_ERROR", evaluatedAt: new Date() },
      });
    } catch (updateError) {
      console.error(
        `Failed to mark unqueued submission ${submission.id} as an internal error:`,
        updateError,
      );
      throw new AggregateError(
        [error, updateError],
        `Failed to enqueue and update submission ${submission.id}.`,
      );
    }

    throw new ApiError(
      503,
      "The submission could not be queued for evaluation. Please try again.",
    );
  }

  return res.status(202).json({
    success: true,
    message: "Submission recorded and waiting for judge processing.",
    submission,
  });
}

export async function getSubmission(req, res) {
  const submission = await prisma.submission.findUnique({
    where: { id: req.params.submissionId },
    include: {
      participant: {
        select: { userId: true, battleId: true },
      },
    },
  });
  if (!submission) throw new ApiError(404, "Submission not found.");
  if (submission.participant.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw new ApiError(403, "You cannot access this submission.");
  }

  const { participant, sourceCode, ...publicSubmission } = submission;
  return res.json({
    success: true,
    submission: { ...publicSubmission, battleId: participant.battleId },
  });
}

export async function listBattleSubmissions(req, res) {
  const participant = await prisma.battleParticipant.findUnique({
    where: { battleId_userId: { battleId: req.params.battleId, userId: req.user.id } },
    select: { id: true },
  });
  if (!participant && req.user.role !== "ADMIN") {
    throw new ApiError(403, "You are not a participant in this battle.");
  }

  const submissions = await prisma.submission.findMany({
    where: participant
      ? { participantId: participant.id }
      : { participant: { is: { battleId: req.params.battleId } } },
    orderBy: { submittedAt: "desc" },
    take: 50,
    select: {
      id: true,
      language: true,
      status: true,
      executionTimeMs: true,
      memoryUsedKb: true,
      passedTestCases: true,
      totalTestCases: true,
      submittedAt: true,
      evaluatedAt: true,
    },
  });
  return res.json({ success: true, submissions });
}

export default { submitCode, getSubmission, listBattleSubmissions };