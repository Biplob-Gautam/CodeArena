import { beforeEach, describe, expect, it, vi } from "vitest";

const { axiosCreate, post } = vi.hoisted(() => {
  const post = vi.fn();
  const axiosCreate = vi.fn(() => ({ post }));
  return { axiosCreate, post };
});

vi.mock("axios", () => ({
  default: { create: axiosCreate },
}));
vi.mock("../src/ml/mlConfig.js", () => ({
  default: { baseURL: "http://ml.test", timeout: 2000 },
}));

import { getInsights, selectProblem } from "../src/ml/mlService.js";

const validInsightsResponse = {
  attempts: 5,
  ready: true,
  messages: [],
  overallAccuracy: 0.6,
  difficulty: {
    EASY: { attempts: 2, accuracy: 1, avgSolveTimeSec: 60 },
    MEDIUM: { attempts: 2, accuracy: 0.5, avgSolveTimeSec: null },
    HARD: { attempts: 1, accuracy: 0, avgSolveTimeSec: null },
  },
  topics: {
    Arrays: { attempts: 3, accuracy: 0.667, smoothedAccuracy: 0.648 },
  },
  strongestTopic: null,
  weakestTopic: null,
  recent10Accuracy: 0.6,
  recent50Accuracy: 0.6,
  recentDelta: 0,
  trend: null,
  solveTimeConsistency: null,
  improvingTopics: [],
  decliningTopics: [],
};

describe("ML service client", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("posts problem selection requests to the FastAPI endpoint", async () => {
    const payload = {
      playerA: { rating: 1500 },
      playerB: { rating: 1520 },
      candidates: [],
    };
    const response = { problem: { problemId: "problem-1" } };
    post.mockResolvedValue({ data: response });

    await expect(selectProblem(payload)).resolves.toEqual(response);

    expect(axiosCreate).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: "http://ml.test",
      timeout: 2000,
    }));
    expect(post).toHaveBeenCalledWith("/select-problem", payload);
  });

  it("posts player history to the FastAPI insights endpoint", async () => {
    const payload = { submissions: [], matches: [] };
    const response = { attempts: 0, ready: false, messages: ["No battles yet."] };
    post.mockResolvedValue({ data: response });

    await expect(getInsights(payload)).resolves.toEqual(response);

    expect(post).toHaveBeenCalledWith("/insights", payload);
  });

  it("returns a valid insights response unchanged, including nullable fields", async () => {
    const response = {
      ...validInsightsResponse,
      record: { wins: 3, losses: 1, draws: 1, winRate: 0.6 },
      ratingHistory: [
        { matchIndex: 1, rating: null, problem: null, result: "DRAW" },
      ],
      performanceVsExpectation: [],
    };
    post.mockResolvedValue({ data: response });

    await expect(getInsights({ submissions: [], matches: [] })).resolves.toBe(response);
  });

  it("rejects responses missing required insights fields", async () => {
    const response = { ...validInsightsResponse };
    delete response.overallAccuracy;
    post.mockResolvedValue({ data: response });

    await expect(getInsights({ submissions: [], matches: [] })).rejects.toThrow(
      "Invalid insights response",
    );
  });

  it("rejects responses with incorrect required field types", async () => {
    post.mockResolvedValue({
      data: { ...validInsightsResponse, attempts: "5" },
    });

    await expect(getInsights({ submissions: [], matches: [] })).rejects.toThrow(
      "Invalid insights response",
    );
  });

  it.each([null, [], "not-an-object"])(
    "rejects malformed response values (%s)",
    async (response) => {
      post.mockResolvedValue({ data: response });

      await expect(getInsights({ submissions: [], matches: [] })).rejects.toThrow(
        "Invalid insights response",
      );
    },
  );

  it("rejects unexpected top-level response fields", async () => {
    post.mockResolvedValue({
      data: { attempts: 0, ready: false, messages: [], extra: true },
    });

    await expect(getInsights({ submissions: [], matches: [] })).rejects.toThrow(
      "Invalid insights response",
    );
  });
});
