import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, enqueueSubmissionEvaluation } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    submission: { updateMany: vi.fn() },
  },
  enqueueSubmissionEvaluation: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({ prisma }));
vi.mock("../src/queues/submissionQueue.js", () => ({
  enqueueSubmissionEvaluation,
}));

import { submitCode } from "../src/controllers/submissionController.js";

function mockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("submission controller", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    enqueueSubmissionEvaluation.mockResolvedValue({});
  });

  it("accepts a valid submission and records it as queued", async () => {
    const now = Date.now();
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: vi.fn().mockResolvedValue([]),
        battleParticipant: {
          findFirst: vi.fn().mockResolvedValue({
            id: "participant-1",
            battle: {
              startsAt: new Date(now - 60_000),
              durationSeconds: 300,
            },
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        submission: {
          create: vi.fn().mockResolvedValue({
            id: "submission-1",
            language: "cpp",
            status: "QUEUED",
            submittedAt: new Date(now),
          }),
        },
      }),
    );

    const req = {
      params: { battleId: "battle-1" },
      user: { id: "user-1" },
      body: {
        language: "cpp",
        sourceCode: "#include <iostream>\nint main(){std::cout << \"ok\";}",
      },
    };
    const res = mockResponse();

    await submitCode(req, res);

    expect(res.statusCode).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.submission.language).toBe("cpp");
    expect(res.body.message).toContain("waiting for judge processing");
    expect(enqueueSubmissionEvaluation).toHaveBeenCalledWith("submission-1");
  });

  it("marks the submission as failed and returns a service error when enqueueing fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const now = Date.now();
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: vi.fn().mockResolvedValue([]),
        battleParticipant: {
          findFirst: vi.fn().mockResolvedValue({
            id: "participant-1",
            battle: {
              startsAt: new Date(now - 60_000),
              durationSeconds: 300,
            },
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        submission: {
          create: vi.fn().mockResolvedValue({
            id: "submission-1",
            language: "cpp",
            status: "QUEUED",
            submittedAt: new Date(now),
          }),
        },
      }),
    );
    enqueueSubmissionEvaluation.mockRejectedValue(new Error("Redis unavailable"));
    const res = mockResponse();

    await expect(
      submitCode(
        {
          params: { battleId: "battle-1" },
          user: { id: "user-1" },
          body: { language: "cpp", sourceCode: "int main() {}" },
        },
        res,
      ),
    ).rejects.toMatchObject({ statusCode: 503 });

    expect(prisma.submission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "submission-1", status: "QUEUED" },
        data: expect.objectContaining({ status: "INTERNAL_ERROR" }),
      }),
    );
  });

  it("rejects submissions with empty source code", async () => {
    const req = {
      params: { battleId: "battle-1" },
      user: { id: "user-1" },
      body: {
        language: "cpp",
        sourceCode: "",
      },
    };

    await expect(submitCode(req, {})).rejects.toMatchObject({ statusCode: 400 });
  });
});
