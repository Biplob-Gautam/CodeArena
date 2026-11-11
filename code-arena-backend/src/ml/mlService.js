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
  clusterTestcases,
  predictMatchOutcome,
};

export default mlService;