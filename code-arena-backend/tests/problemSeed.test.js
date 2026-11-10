import { describe, expect, it } from "vitest";

import { problems, validateSeedData } from "../scripts/seedProblems.js";

function solveTwoSum(input) {
  const [length, ...values] = input.trim().split(/\s+/).map(Number);
  const target = values.pop();
  const indices = new Map();
  for (let index = 0; index < length; index += 1) {
    const complement = target - values[index];
    if (indices.has(complement)) {
      return `${indices.get(complement)} ${index}`;
    }
    if (!indices.has(values[index])) indices.set(values[index], index);
  }
  return "";
}

function solveBinarySearch(input) {
  const [length, target, ...values] = input.trim().split(/\s+/).map(Number);
  return String(values.slice(0, length).indexOf(target));
}

function solveValidParentheses(input) {
  const closingToOpening = { ")": "(", "}": "{", "]": "[" };
  const stack = [];
  for (const bracket of input.trim()) {
    if (closingToOpening[bracket]) {
      if (stack.pop() !== closingToOpening[bracket]) return "NO";
    } else {
      stack.push(bracket);
    }
  }
  return stack.length === 0 ? "YES" : "NO";
}

function solveMaximumSubarray(input) {
  const [length, ...values] = input.trim().split(/\s+/).map(Number);
  let current = values[0];
  let best = current;
  for (let index = 1; index < length; index += 1) {
    current = Math.max(values[index], current + values[index]);
    best = Math.max(best, current);
  }
  return String(best);
}

const referenceSolvers = {
  "two-sum": solveTwoSum,
  "binary-search": solveBinarySearch,
  "valid-parentheses": solveValidParentheses,
  "maximum-subarray": solveMaximumSubarray,
};

describe("curated problem seed data", () => {
  it("meets the release test-count, visibility, and battle-duration requirements", () => {
    expect(() => validateSeedData()).not.toThrow();
    expect(problems.map((problem) => problem.slug)).toEqual([
      "two-sum",
      "binary-search",
      "valid-parentheses",
      "maximum-subarray",
    ]);

    for (const problem of problems) {
      expect(problem.testCases).toHaveLength(10);
      expect(problem.testCases.filter((testCase) => !testCase.isHidden)).toHaveLength(2);
      expect(problem.battleDurationSeconds).toBe(
        { EASY: 1200, MEDIUM: 1800, HARD: 2700 }[problem.difficulty],
      );
    }
  });

  it("has expected outputs that match reference solutions for every case", () => {
    for (const problem of problems) {
      const solve = referenceSolvers[problem.slug];
      for (const testCase of problem.testCases) {
        expect(solve(testCase.input).trim(), `${problem.slug} case ${testCase.position}`)
          .toBe(testCase.expectedOutput.trim());
      }
    }
  });

  it("rejects a seed with an out-of-range test-case count", () => {
    const invalidProblem = {
      ...problems[0],
      testCases: problems[0].testCases.slice(0, 5),
    };

    expect(() => validateSeedData([invalidProblem])).toThrow(
      'Problem "two-sum" must have between 10 and 15 test cases.',
    );
  });

  it("rejects a seed with a duration that does not match the difficulty", () => {
    const invalidProblem = {
      ...problems[0],
      battleDurationSeconds: 900,
    };

    expect(() => validateSeedData([invalidProblem])).toThrow(
      'Problem "two-sum" must use the EASY battle duration.',
    );
  });
});
