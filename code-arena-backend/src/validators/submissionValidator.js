import { z } from "zod";

export const battleSubmissionParamsSchema = z.object({
  battleId: z
    .string({ required_error: "Battle ID is required." })
    .trim()
    .min(1, "Battle ID is required.")
    .max(128, "Battle ID is too long.")
    .regex(/^[A-Za-z0-9._:-]+$/, "Battle ID contains invalid characters."),
});

export const submissionPayloadSchema = z.object({
  language: z.string().trim().min(1).max(40, "Language name is too long."),
  sourceCode: z.string().min(1).max(100_000, "Source code must be no larger than 100 KB."),
});

export const submissionResultParamsSchema = z.object({
  submissionId: z
    .string({ required_error: "Submission ID is required." })
    .trim()
    .min(1, "Submission ID is required.")
    .max(128, "Submission ID is too long.")
    .regex(/^[A-Za-z0-9._:-]+$/, "Submission ID contains invalid characters."),
});

export default {
  battleSubmissionParamsSchema,
  submissionPayloadSchema,
  submissionResultParamsSchema,
};
