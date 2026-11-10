import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

export async function getBattleResult(req, res) {
  const battle = await prisma.battle.findUnique({
    where: { id: req.params.battleId },
    include: {
      problem: { select: { id: true, title: true, difficulty: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              rating: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!battle) throw new ApiError(404, "Battle not found.");
  if (
    req.user.role !== "ADMIN" &&
    !battle.participants.some((participant) => participant.userId === req.user.id)
  ) {
    throw new ApiError(403, "You are not a participant in this battle.");
  }

  const submissionRows = battle.participants.length
    ? await prisma.$queryRaw`
        SELECT
          "participantId",
          "status",
          "executionTimeMs",
          "memoryUsedKb",
          "passedTestCases",
          "totalTestCases",
          "submittedAt",
          "submissionOrder"
        FROM "Submission"
        WHERE "participantId" IN (
          SELECT "id" FROM "BattleParticipant" WHERE "battleId" = ${battle.id}
        )
        ORDER BY "submissionOrder" ASC
      `
    : [];
  const submissionsByParticipant = new Map();
  for (const submission of submissionRows) {
    const submissions = submissionsByParticipant.get(submission.participantId) ?? [];
    submissions.push(submission);
    submissionsByParticipant.set(submission.participantId, submissions);
  }

  const players = battle.participants.map((participant) => {
    const submissions = submissionsByParticipant.get(participant.id) ?? [];
    return {
      user: participant.user,
      result: participant.result,
      acceptedAt: participant.acceptedAt,
      totalSubmissions: participant.totalSubmissions,
      passedTestCases: participant.passedTestCases,
      ratingBefore: participant.ratingBefore,
      ratingAfter: participant.ratingAfter,
      ratingChange: participant.ratingChange,
      latestSubmission: submissions.at(-1) ?? null,
      firstAcceptedSubmission:
        submissions.find((submission) => submission.status === "ACCEPTED") ?? null,
    };
  });

  const result = {
    battleId: battle.id,
    status: battle.status,
    startsAt: battle.startsAt,
    endsAt: battle.endsAt,
    durationSeconds: battle.durationSeconds,
    problem: battle.problem,
    players,
  };

  return res.json({ success: true, result });
}

export default { getBattleResult };