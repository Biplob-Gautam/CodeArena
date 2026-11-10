import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const largeTwoSumValues = Array.from({ length: 10_000 }, (_, index) => index + 1);
const largeBinarySearchValues = Array.from(
  { length: 10_000 },
  (_, index) => index - 5_000,
);
const largeMaximumSubarrayValues = Array(100_000).fill(1);
const largeValidParenthesesInput = "()".repeat(50_000);

export const problems = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "EASY",
    description:
      "Given an array of integers and a target value, find the zero-based indices of two distinct elements whose values add up to the target. Exactly one solution exists.",
    inputFormat:
      "The first line contains integer n. The second line contains n space-separated integers. The third line contains the target integer.",
    outputFormat:
      "Print the two zero-based indices in increasing order, separated by a space.",
    constraints: [
      "2 <= n <= 10000",
      "-1000000000 <= nums[i] <= 1000000000",
      "-2000000000 <= target <= 2000000000",
      "Exactly one valid pair exists.",
      "The two indices must be distinct.",
    ],
    examples: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        explanation: "nums[0] + nums[1] equals 9.",
      },
      {
        input: "3\n3 2 4\n6",
        output: "1 2",
        explanation: "nums[1] + nums[2] equals 6.",
      },
    ],
    tags: ["array", "hash-table"],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    battleDurationSeconds: 1200,
    isPublished: true,
    testCases: [
      { position: 1, input: "4\n2 7 11 15\n9\n", expectedOutput: "0 1\n", isHidden: false, points: 1 },
      { position: 2, input: "3\n3 2 4\n6\n", expectedOutput: "1 2\n", isHidden: false, points: 1 },
      { position: 3, input: "4\n3 3 8 10\n6\n", expectedOutput: "0 1\n", isHidden: true, points: 1 },
      { position: 4, input: "5\n-4 0 7 3 12\n12\n", expectedOutput: "1 4\n", isHidden: true, points: 1 },
      { position: 5, input: "6\n1000000000 -1000000000 5 9 2 4\n0\n", expectedOutput: "0 1\n", isHidden: true, points: 1 },
      { position: 6, input: "5\n-3 -1 0 2 4\n3\n", expectedOutput: "1 4\n", isHidden: true, points: 1 },
      { position: 7, input: "4\n0 4 3 0\n0\n", expectedOutput: "0 3\n", isHidden: true, points: 1 },
      { position: 8, input: "5\n1 2 3 4 5\n9\n", expectedOutput: "3 4\n", isHidden: true, points: 1 },
      { position: 9, input: "4\n-5 -2 1 8\n-7\n", expectedOutput: "0 1\n", isHidden: true, points: 1 },
      {
        position: 10,
        input: `${largeTwoSumValues.length}\n${largeTwoSumValues.join(" ")}\n19999\n`,
        expectedOutput: "9998 9999\n",
        isHidden: true,
        points: 1,
      },
    ],
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    difficulty: "EASY",
    description:
      "Given a sorted array of distinct integers and a target value, return the zero-based index of the target. Print -1 if the target is not in the array.",
    inputFormat:
      "The first line contains n and target. The second line contains n integers in strictly increasing order.",
    outputFormat: "Print the zero-based index of target, or -1 if it is absent.",
    constraints: [
      "1 <= n <= 100000",
      "-1000000000 <= nums[i], target <= 1000000000",
      "The array is sorted in strictly increasing order.",
    ],
    examples: [
      {
        input: "6 9\n-1 0 3 5 9 12",
        output: "4",
        explanation: "The target 9 is at index 4.",
      },
    ],
    tags: ["array", "binary-search"],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    battleDurationSeconds: 1200,
    isPublished: true,
    testCases: [
      { position: 1, input: "6 9\n-1 0 3 5 9 12\n", expectedOutput: "4\n", isHidden: false, points: 1 },
      { position: 2, input: "6 2\n-1 0 3 5 9 12\n", expectedOutput: "-1\n", isHidden: false, points: 1 },
      { position: 3, input: "1 7\n7\n", expectedOutput: "0\n", isHidden: true, points: 1 },
      { position: 4, input: "5 -8\n-20 -8 -3 0 14\n", expectedOutput: "1\n", isHidden: true, points: 1 },
      { position: 5, input: "4 10\n-5 -2 1 8\n", expectedOutput: "-1\n", isHidden: true, points: 1 },
      { position: 6, input: "5 -20\n-20 -10 -5 0 8\n", expectedOutput: "0\n", isHidden: true, points: 1 },
      { position: 7, input: "5 14\n-9 -2 0 6 14\n", expectedOutput: "4\n", isHidden: true, points: 1 },
      { position: 8, input: "7 1\n-10 -4 -1 1 3 8 20\n", expectedOutput: "3\n", isHidden: true, points: 1 },
      { position: 9, input: "4 -6\n-10 -6 -2 3\n", expectedOutput: "1\n", isHidden: true, points: 1 },
      {
        position: 10,
        input: `${largeBinarySearchValues.length} 4999\n${largeBinarySearchValues.join(" ")}\n`,
        expectedOutput: "9999\n",
        isHidden: true,
        points: 1,
      },
    ],
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "EASY",
    description:
      "Given a string containing only the characters (, ), {, }, [, and ], determine whether every opening bracket is closed by the same type of bracket in the correct order. Print YES if the string is valid; otherwise print NO.",
    inputFormat: "A non-empty string of brackets.",
    outputFormat: "Print YES if the brackets are valid; otherwise print NO.",
    constraints: [
      "1 <= s.length <= 100000",
      "s contains only (, ), {, }, [, and ].",
    ],
    examples: [
      {
        input: "{[]()}",
        output: "YES",
        explanation: "Every bracket is closed in the correct order.",
      },
    ],
    tags: ["string", "stack"],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    battleDurationSeconds: 1200,
    isPublished: true,
    testCases: [
      { position: 1, input: "{[]()}\n", expectedOutput: "YES\n", isHidden: false, points: 1 },
      { position: 2, input: "([)]\n", expectedOutput: "NO\n", isHidden: false, points: 1 },
      { position: 3, input: "((()))\n", expectedOutput: "YES\n", isHidden: true, points: 1 },
      { position: 4, input: "((()\n", expectedOutput: "NO\n", isHidden: true, points: 1 },
      { position: 5, input: "]\n", expectedOutput: "NO\n", isHidden: true, points: 1 },
      { position: 6, input: "()\n", expectedOutput: "YES\n", isHidden: true, points: 1 },
      { position: 7, input: "{}[]\n", expectedOutput: "YES\n", isHidden: true, points: 1 },
      { position: 8, input: "([{}])\n", expectedOutput: "YES\n", isHidden: true, points: 1 },
      { position: 9, input: "{[}]\n", expectedOutput: "NO\n", isHidden: true, points: 1 },
      {
        position: 10,
        input: `${largeValidParenthesesInput}\n`,
        expectedOutput: "YES\n",
        isHidden: true,
        points: 1,
      },
    ],
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "MEDIUM",
    description:
      "Given an integer array, find the largest possible sum of a non-empty contiguous subarray.",
    inputFormat:
      "The first line contains n. The second line contains n space-separated integers.",
    outputFormat: "Print the maximum sum of any non-empty contiguous subarray.",
    constraints: [
      "1 <= n <= 100000",
      "-1000000000 <= nums[i] <= 1000000000",
    ],
    examples: [
      {
        input: "9\n-2 1 -3 4 -1 2 1 -5 4",
        output: "6",
        explanation: "The subarray [4, -1, 2, 1] has the largest sum, 6.",
      },
    ],
    tags: ["array", "dynamic-programming"],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    battleDurationSeconds: 1800,
    isPublished: true,
    testCases: [
      { position: 1, input: "9\n-2 1 -3 4 -1 2 1 -5 4\n", expectedOutput: "6\n", isHidden: false, points: 1 },
      { position: 2, input: "5\n-8 -3 -6 -2 -5\n", expectedOutput: "-2\n", isHidden: false, points: 1 },
      { position: 3, input: "1\n7\n", expectedOutput: "7\n", isHidden: true, points: 1 },
      { position: 4, input: "5\n1 2 3 4 5\n", expectedOutput: "15\n", isHidden: true, points: 1 },
      { position: 5, input: "6\n5 -10 6 7 -2 3\n", expectedOutput: "14\n", isHidden: true, points: 1 },
      { position: 6, input: "3\n0 0 0\n", expectedOutput: "0\n", isHidden: true, points: 1 },
      { position: 7, input: "3\n-1 -2 -3\n", expectedOutput: "-1\n", isHidden: true, points: 1 },
      { position: 8, input: "4\n8 -1 3 4\n", expectedOutput: "14\n", isHidden: true, points: 1 },
      { position: 9, input: "6\n4 -1 2 1 -5 4\n", expectedOutput: "6\n", isHidden: true, points: 1 },
      {
        position: 10,
        input: `${largeMaximumSubarrayValues.length}\n${largeMaximumSubarrayValues.join(" ")}\n`,
        expectedOutput: "100000\n",
        isHidden: true,
        points: 1,
      },
    ],
  },
];

export function validateSeedData(seedProblems = problems) {
  const slugs = new Set();
  const durationByDifficulty = {
    EASY: 20 * 60,
    MEDIUM: 30 * 60,
    HARD: 45 * 60,
  };

  for (const problem of seedProblems) {
    if (slugs.has(problem.slug)) {
      throw new Error(`Duplicate problem slug in seed data: ${problem.slug}`);
    }
    slugs.add(problem.slug);

    if (problem.battleDurationSeconds !== durationByDifficulty[problem.difficulty]) {
      throw new Error(
        `Problem "${problem.slug}" must use the ${problem.difficulty} battle duration.`,
      );
    }

    if (
      !Array.isArray(problem.testCases) ||
      problem.testCases.length < 10 ||
      problem.testCases.length > 15
    ) {
      throw new Error(
        `Problem "${problem.slug}" must have between 10 and 15 test cases.`,
      );
    }

    const visibleCases = problem.testCases.filter((testCase) => !testCase.isHidden);
    if (visibleCases.length !== 2) {
      throw new Error(`Problem "${problem.slug}" must have exactly two visible test cases.`);
    }

    const positions = new Set();
    for (const testCase of problem.testCases) {
      if (!Number.isInteger(testCase.position) || testCase.position < 1) {
        throw new Error(`Problem "${problem.slug}" has an invalid test case position.`);
      }
      if (positions.has(testCase.position)) {
        throw new Error(
          `Problem "${problem.slug}" has duplicate test case position ${testCase.position}.`,
        );
      }
      positions.add(testCase.position);
      if (
        typeof testCase.input !== "string" ||
        typeof testCase.expectedOutput !== "string" ||
        !Number.isInteger(testCase.points) ||
        testCase.points < 1
      ) {
        throw new Error(`Problem "${problem.slug}" has an invalid test case.`);
      }
    }
    if ([...positions].some((position, index) => position !== index + 1)) {
      throw new Error(`Problem "${problem.slug}" test case positions must be consecutive.`);
    }
  }
}

export async function seedProblems(prisma, seedData = problems) {
  validateSeedData(seedData);

  for (const { testCases, ...problemData } of seedData) {
    const problem = await prisma.problem.upsert({
      where: { slug: problemData.slug },
      update: problemData,
      create: problemData,
    });

    await prisma.$transaction(
      testCases.map((testCase) =>
        prisma.testCase.upsert({
          where: {
            problemId_position: {
              problemId: problem.id,
              position: testCase.position,
            },
          },
          update: {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            isHidden: testCase.isHidden,
            points: testCase.points,
          },
          create: {
            ...testCase,
            problemId: problem.id,
          },
        }),
      ),
    );

    console.info(
      `Seeded problem "${problem.title}" (${problem.slug}) with ${testCases.length} test cases.`,
    );
  }
}

export async function runSeed() {
  const prisma = new PrismaClient();
  try {
    await seedProblems(prisma);
  } catch (error) {
    console.error("Problem seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runSeed();
}