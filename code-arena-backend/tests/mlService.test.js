import { describe, expect, it, vi } from "vitest";

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

import { selectProblem } from "../src/ml/mlService.js";

describe("ML service client", () => {
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
});
