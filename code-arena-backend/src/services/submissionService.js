import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";
import {
  getBatchSubmissionResults,
  submitSubmission as submitToJudge0,
} from "./judge0Service.js";

const maxSourceBytes = 100_000;

export async function createSubmission({ battleId, userId, language, sourceCode }) {
  if (typeof language !== "string" || !language.trim() || language.length > 40) {
    throw new ApiError(400, "A supported programming language is required.");
  }
  if (
    typeof sourceCode !== "string" ||
    !sourceCode.trim() ||
    Buffer.byteLength(sourceCode, "utf8") > maxSourceBytes
  ) {
    throw new ApiError(400, "Source code must be non-empty and no larger than 100 KB.");
  }

  return prisma.$transaction(async (tx) => {
    const participant = await tx.battleParticipant.findFirst({
      where: {
        battleId,
        userId,
        battle: { status: "IN_PROGRESS" },
      },
      include: {
        battle: {
          select: {
            startsAt: true,
            durationSeconds: true,
            problem: {
              select: {
                timeLimitMs: true,
                memoryLimitMb: true,
                testCases: {
                  orderBy: { position: "asc" },
                  select: { input: true, expectedOutput: true, isHidden: true },
                },
              },
            },
          },
        },
      },
    });
    if (!participant) throw new ApiError(404, "Active battle participation was not found.");

    const deadline = participant.battle.startsAt
      ? participant.battle.startsAt.getTime() +
        participant.battle.durationSeconds * 1000
      : 0;
    if (!deadline || Date.now() >= deadline) {
      throw new ApiError(409, "The battle has ended; submissions are no longer accepted.");
    }

    const submission = await tx.submission.create({
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

    return submission;
  });
}

export async function evaluateSubmission(submissionId, { signal } = {}) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      participant: {
        include: {
          battle: {
            include: {
              problem: {
                include: { testCases: { orderBy: { position: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
  if (!submission) throw new ApiError(404, "Submission not found.");
  if (submission.status !== "QUEUED") {
    throw new ApiError(409, `Submission cannot be evaluated from status ${submission.status}.`);
  }

  const tests = submission.participant.battle.problem.testCases;
  if (!tests.length) throw new ApiError(500, "The problem has no configured test cases.");

  const started = await submitToJudge0({
    language: submission.language,
    sourceCode: submission.sourceCode,
    testCases: tests,
    timeLimitMs: submission.participant.battle.problem.timeLimitMs,
    memoryLimitMb: submission.participant.battle.problem.memoryLimitMb,
    signal,
  });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.submission.updateMany({
      where: { id: submissionId, status: "QUEUED" },
      data: {
        status: "PROCESSING",
        judge0Token: JSON.stringify(started.tokens),
        totalTestCases: tests.length,
      },
    });
    if (updated.count !== 1) {
      throw new ApiError(409, "Submission status changed while evaluation was starting.");
    }
    return { submissionId, judge0Tokens: started.tokens };
  });
}

function decodeJudgeField(value) {
  if (typeof value !== "string") return value ?? null;
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
}

function getAggregateJudgeResult(results) {
  if (!Array.isArray(results) || results.length === 0) {
    throw new ApiError(502, "Judge returned no test-case results.");
  }
  const statuses = results.map((result) => result.status?.description);
  if (
    statuses.some(
      (status) => status === "In Queue" || status === "Processing" || !status,
    )
  ) {
    return { pending: true };
  }

  const passedTestCases = statuses.filter((status) => status === "Accepted").length;
  let status = "ACCEPTED";
  if (passedTestCases !== results.length) {
    const priority = [
      ["Internal Error", "INTERNAL_ERROR"],
      ["Compilation Error", "COMPILATION_ERROR"],
      ["Time Limit Exceeded", "TIME_LIMIT_EXCEEDED"],
      ["Memory Limit Exceeded", "MEMORY_LIMIT_EXCEEDED"],
      ["Runtime Error (SIGSEGV)", "RUNTIME_ERROR"],
      ["Runtime Error (NZEC)", "RUNTIME_ERROR"],
      ["Runtime Error", "RUNTIME_ERROR"],
      ["Output Limit Exceeded", "RUNTIME_ERROR"],
    ];
    status =
      priority.find(([description]) =>
        description === "Runtime Error"
          ? statuses.some((item) => item.startsWith(description))
          : statuses.includes(description),
      )?.[1] ?? "WRONG_ANSWER";
  }

  return {
    pending: false,
    status,
    passedTestCases,
    totalTestCases: results.length,
    stdout: decodeJudgeField(results.at(-1)?.stdout),
    stderr: decodeJudgeField(results.find((result) => result.stderr)?.stderr),
    compileOutput: decodeJudgeField(
      results.find((result) => result.compile_output)?.compile_output,
    ),
    executionTimeMs: Math.max(
      0,
      ...results.map((result) => Number(result.time || 0) * 1000),
    ),
    memoryUsedKb: Math.max(0, ...results.map((result) => Number(result.memory || 0))),
  };
}

export async function pollSubmission(submissionId, { signal } = {}) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, status: true, judge0Token: true },
  });
  if (!submission) throw new ApiError(404, "Submission not found.");
  if (submission.status !== "PROCESSING" || !submission.judge0Token) {
    throw new ApiError(409, "Submission is not waiting for Judge0 results.");
  }

  let tokens;
  try {
    tokens = JSON.parse(submission.judge0Token);
  } catch (error) {
    throw new ApiError(500, "Stored Judge0 token data is invalid.");
  }
  const results = await getBatchSubmissionResults(tokens, { signal });
  const aggregate = getAggregateJudgeResult(results);
  if (aggregate.pending) return { status: "PROCESSING" };

  await recordJudgeResult(submissionId, aggregate);
  return { status: aggregate.status };
}

export async function recordJudgeResult(submissionId, judgeResult) {
  const submission = await prisma.$transaction(async (tx) => {
    const current = await tx.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        participantId: true,
        status: true,
        submittedAt: true,
        participant: {
          select: { acceptedAt: true, passedTestCases: true },
        },
      },
    });
    if (!current) throw new ApiError(404, "Submission not found.");
    if (current.status !== "PROCESSING") {
      throw new ApiError(409, "Only processing submissions can receive a judge result.");
    }

    const updated = await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: judgeResult.status,
        stdout: judgeResult.stdout ?? null,
        stderr: judgeResult.stderr ?? null,
        compileOutput: judgeResult.compileOutput ?? null,
        executionTimeMs: judgeResult.executionTimeMs ?? null,
        memoryUsedKb: judgeResult.memoryUsedKb ?? null,
        passedTestCases: judgeResult.passedTestCases,
        totalTestCases: judgeResult.totalTestCases,
        evaluatedAt: new Date(),
      },
    });

    await tx.battleParticipant.update({
      where: { id: current.participantId },
      data: {
        ...(judgeResult.status === "ACCEPTED" &&
        (!current.participant.acceptedAt ||
          current.submittedAt < current.participant.acceptedAt)
          ? { acceptedAt: current.submittedAt }
          : {}),
        passedTestCases: {
          set: Math.max(
            current.participant.passedTestCases,
            judgeResult.passedTestCases,
          ),
        },
      },
    });
    return updated;
  });
  return submission;
}

export async function getSubmissionById(submissionId, userId, role = "USER") {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { participant: { select: { userId: true, battleId: true } } },
  });
  if (!submission) throw new ApiError(404, "Submission not found.");
  if (submission.participant.userId !== userId && role !== "ADMIN") {
    throw new ApiError(403, "You cannot access this submission.");
  }
  const { participant, sourceCode, ...safeSubmission } = submission;
  return { ...safeSubmission, battleId: participant.battleId };
}

export async function getBattleSubmissions(battleId, userId, role = "USER") {
  const participant = await prisma.battleParticipant.findUnique({
    where: { battleId_userId: { battleId, userId } },
    select: { id: true },
  });
  if (!participant && role !== "ADMIN") {
    throw new ApiError(403, "You are not a participant in this battle.");
  }
  return prisma.submission.findMany({
    where: participant
      ? { participantId: participant.id }
      : { participant: { is: { battleId } } },
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
}

export default {
  createSubmission,
  evaluateSubmission,
  pollSubmission,
  recordJudgeResult,
  getSubmissionById,
  getBattleSubmissions,
};