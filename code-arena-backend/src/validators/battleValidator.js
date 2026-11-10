import { z } from "zod";

export const battleIdParamSchema = z.object({
  battleId: z
    .string({ required_error: "Battle ID is required." })
    .trim()
    .min(1, "Battle ID is required.")
    .max(128, "Battle ID is too long.")
    .regex(/^[A-Za-z0-9._:-]+$/, "Battle ID contains invalid characters."),
});

export const battleHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
});

export default {
  battleIdParamSchema,
  battleHistoryQuerySchema,
};
