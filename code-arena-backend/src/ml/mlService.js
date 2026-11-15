import axios from "axios";
import mlConfig from "./mlConfig.js";

const mlClient = axios.create({
  baseURL: mlConfig.baseURL,
  timeout: mlConfig.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

async function postModel(endpoint, payload, context) {
  try {
    const response = await mlClient.post(endpoint, payload);
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${context}: ${message}`, { cause: error });
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUnitInterval(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isSignedUnitInterval(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -1 && value <= 1;
}

function isNullableUnitInterval(value) {
  return value === null || isUnitInterval(value);
}

function isNullableNumber(value) {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

const insightsResponseKeys = new Set([
  "attempts",
  "ready",
  "messages",
  "overallAccuracy",
  "difficulty",
  "topics",
  "strongestTopic",
  "weakestTopic",
  "recent10Accuracy",
  "recent50Accuracy",
  "recentDelta",
  "trend",
  "solveTimeConsistency",
  "improvingTopics",
  "decliningTopics",
  "record",
  "ratingHistory",
  "performanceVsExpectation",
  "performanceLabel",
]);

function isInsightsResponse(value) {
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => !insightsResponseKeys.has(key)) ||
    !Number.isInteger(value.attempts) ||
    value.attempts < 0 ||
    typeof value.ready !== "boolean" ||
    value.ready !== (value.attempts >= 5) ||
    !isStringArray(value.messages)
  ) {
    return false;
  }

  const hasSubmissionAnalytics = [
    "overallAccuracy",
    "difficulty",
    "topics",
    "strongestTopic",
    "weakestTopic",
    "recent10Accuracy",
    "recent50Accuracy",
    "recentDelta",
    "trend",
    "solveTimeConsistency",
    "improvingTopics",
    "decliningTopics",
  ].some((key) => key in value);
  if (value.attempts > 0 || hasSubmissionAnalytics) {
    if (
      !isUnitInterval(value.overallAccuracy) ||
      !isRecord(value.difficulty) ||
      !isRecord(value.topics) ||
      !(value.strongestTopic === null || typeof value.strongestTopic === "string") ||
      !(value.weakestTopic === null || typeof value.weakestTopic === "string") ||
      !isUnitInterval(value.recent10Accuracy) ||
      !isUnitInterval(value.recent50Accuracy) ||
      !isSignedUnitInterval(value.recentDelta) ||
      ![null, "IMPROVING", "DECLINING", "STABLE"].includes(value.trend) ||
      !(value.solveTimeConsistency === null || isRecord(value.solveTimeConsistency)) ||
      !isStringArray(value.improvingTopics) ||
      !isStringArray(value.decliningTopics)
    ) {
      return false;
    }

    for (const difficulty of ["EASY", "MEDIUM", "HARD"]) {
      const stats = value.difficulty[difficulty];
      if (
        !isRecord(stats) ||
        !Number.isInteger(stats.attempts) ||
        stats.attempts < 0 ||
        !isNullableUnitInterval(stats.accuracy) ||
        !isNullableNumber(stats.avgSolveTimeSec)
      ) {
        return false;
      }
    }

    for (const stats of Object.values(value.topics)) {
      if (
        !isRecord(stats) ||
        !Number.isInteger(stats.attempts) ||
        stats.attempts < 0 ||
        !isUnitInterval(stats.accuracy) ||
        !isUnitInterval(stats.smoothedAccuracy)
      ) {
        return false;
      }
    }

    if (
      value.solveTimeConsistency !== null &&
      (!Number.isFinite(value.solveTimeConsistency.coefficientOfVariation) ||
        !["CONSISTENT", "VARIABLE"].includes(value.solveTimeConsistency.label))
    ) {
      return false;
    }
  }

  const hasMatchAnalytics =
    "record" in value ||
    "ratingHistory" in value ||
    "performanceVsExpectation" in value ||
    "performanceLabel" in value;
  if (hasMatchAnalytics) {
    if (
      !isRecord(value.record) ||
      !["wins", "losses", "draws"].every(
        (key) => Number.isInteger(value.record[key]) && value.record[key] >= 0,
      ) ||
      !isUnitInterval(value.record.winRate) ||
      !Array.isArray(value.ratingHistory) ||
      !Array.isArray(value.performanceVsExpectation)
    ) {
      return false;
    }

    if (
      !value.ratingHistory.every(
        (entry) =>
          isRecord(entry) &&
          Number.isInteger(entry.matchIndex) &&
          isNullableNumber(entry.rating) &&
          (entry.problem === null || typeof entry.problem === "string") &&
          ["WIN", "LOSS", "DRAW"].includes(entry.result),
      ) ||
      !value.performanceVsExpectation.every(
        (entry) =>
          isRecord(entry) &&
          Number.isInteger(entry.fromMatch) &&
          Number.isInteger(entry.toMatch) &&
          isUnitInterval(entry.actualWinRate) &&
          isUnitInterval(entry.predictedWinRate) &&
          Number.isFinite(entry.difference),
      )
    ) {
      return false;
    }

    if (
      "performanceLabel" in value &&
      !["OVERPERFORMING", "UNDERPERFORMING", "AS_EXPECTED"].includes(
        value.performanceLabel,
      )
    ) {
      return false;
    }
  }

  return true;
}

export function generateSkillVector(playerData) {
  return postModel("/skill-vector", playerData, "Skill Vector Model Error");
}

export function selectProblem(payload) {
  return postModel(
    "/select-problem",
    payload,
    "Problem Recommendation Model Error",
  );
}

export async function getInsights(payload) {
  const response = await postModel(
    "/insights",
    payload,
    "Player Insights Model Error",
  );
  if (!isInsightsResponse(response)) {
    throw new Error("Player Insights Model Error: Invalid insights response.");
  }
  return response;
}

export const recommendProblem = selectProblem;

export function clusterTestcases(testcases) {
  return postModel(
    "/cluster-testcases",
    { testcases },
    "Testcase Clustering Model Error",
  );
}

export function predictMatchOutcome(matchData) {
  return postModel(
    "/predict-outcome",
    matchData,
    "Match Outcome Prediction Error",
  );
}

const mlService = {
  generateSkillVector,
  recommendProblem,
  getInsights,
  clusterTestcases,
  predictMatchOutcome,
};

export default mlService;