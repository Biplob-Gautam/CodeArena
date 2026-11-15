import { prisma } from "../config/database.js";
import { getInsights } from "../ml/mlService.js";
import { getMlTopic } from "./matchmakingService.js";
import ApiError from "../utils/ApiError.js";

const validResults = new Set(["WIN", "LOSS", "DRAW"]);
const validDifficulties = new Set(["EASY", "MEDIUM", "HARD"]);

function timestamp(value) {
  if (value == null) return null;
  const milliseconds = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function battleTime(battle) {
  return (
    timestamp(battle.startsAt) ??
    timestamp(battle.endsAt) ??
    timestamp(battle.createdAt) ??
    0
  );
}

export function buildInsightsPayload(participants) {
  const completed = participants
    .filter(
      (participant) =>
        participant?.battle?.status === "COMPLETED" &&
        validResults.has(participant.result),
    )
    .sort((left, right) => {
      const byTime = battleTime(left.battle) - battleTime(right.battle);
      if (byTime !== 0) return byTime;
      return String(left.battle.id ?? "").localeCompare(String(right.battle.id ?? ""));
    });

  const submissions = [];
  const matches = [];

  completed.forEach((participant, index) => {
    const { battle } = participant;
    const matchIndex = index + 1;
    const problem = battle.problem;
    const topic = getMlTopic(problem?.tags);
    const acceptedSubmissions = (participant.submissions ?? [])
      .filter((submission) => submission?.status === "ACCEPTED")
      .sort(
        (left, right) =>
          (timestamp(left.submittedAt) ?? Infinity) -
          (timestamp(right.submittedAt) ?? Infinity),
      );
    const accepted = acceptedSubmissions.length > 0;
    const startsAt = timestamp(battle.startsAt);
    const firstAcceptedAt = accepted
      ? timestamp(acceptedSubmissions[0].submittedAt)
      : null;
    const solveTimeSec =
      startsAt !== null && firstAcceptedAt !== null && firstAcceptedAt >= startsAt
        ? (firstAcceptedAt - startsAt) / 1000
        : null;

    if (validDifficulties.has(problem?.difficulty)) {
      submissions.push({
        difficulty: problem.difficulty,
        topic,
        accepted,
        solveTimeSec,
        matchIndex,
      });
    }

    const ratingAfter = battle.ratingHistories?.[0]?.ratingAfter;
    const match = { matchIndex, result: participant.result };
    if (Number.isFinite(ratingAfter)) match.ratingAfter = ratingAfter;
    if (typeof problem?.title === "string") match.problemTitle = problem.title;
    matches.push(match);
  });

  return { submissions, matches };
}

export async function getPlayerInsights(userId) {
  const participants = await prisma.battleParticipant.findMany({
    where: {
      userId,
      result: { in: ["WIN", "LOSS", "DRAW"] },
      battle: { status: "COMPLETED" },
    },
    select: {
      result: true,
      submissions: {
        where: { status: "ACCEPTED" },
        select: { status: true, submittedAt: true },
      },
      battle: {
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
          problem: {
            select: { title: true, difficulty: true, tags: true },
          },
          ratingHistories: {
            where: { userId, reason: "BATTLE_RESULT" },
            select: { ratingAfter: true },
            take: 1,
          },
        },
      },
    },
  });

  const payload = buildInsightsPayload(participants);
  try {
    return await getInsights(payload);
  } catch (error) {
    console.warn("Player insights service is unavailable.", error);
    throw new ApiError(503, "Player insights are temporarily unavailable.");
  }
}
