import { prisma } from "../config/database.js";
import ApiError from "../utils/ApiError.js";

const publicProblemSelect = {
  id: true,
  slug: true,
  title: true,
  difficulty: true,
  description: true,
  inputFormat: true,
  outputFormat: true,
  constraints: true,
  examples: true,
  tags: true,
  timeLimitMs: true,
  memoryLimitMb: true,
  battleDurationSeconds: true,
  createdAt: true,
};

export async function listProblems(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const where = { isPublished: true };

  if (req.query.difficulty) {
    const difficulty = String(req.query.difficulty).toUpperCase();
    if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      throw new ApiError(400, "difficulty must be EASY, MEDIUM, or HARD.");
    }
    where.difficulty = difficulty;
  }
  if (req.query.tag) {
    where.tags = { has: String(req.query.tag).slice(0, 50) };
  }

  const [total, problems] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      select: publicProblemSelect,
      orderBy: [{ difficulty: "asc" }, { title: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    success: true,
    problems,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getProblem(req, res) {
  const idOrSlug = req.params.problemId;
  if (!idOrSlug) throw new ApiError(400, "A problem ID or slug is required.");

  const problem = await prisma.problem.findFirst({
    where: {
      isPublished: true,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: {
      ...publicProblemSelect,
      testCases: {
        where: { isHidden: false },
        select: { position: true, input: true, expectedOutput: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!problem) throw new ApiError(404, "Problem not found.");
  return res.json({ success: true, problem });
}

export default { listProblems, getProblem };