import { judge0Request } from "../config/judge0.js";
import ApiError from "../utils/ApiError.js";

const languageIds = Object.freeze({
  "C++": 54,
  cpp: 54,
  "C++ (GCC 9.2.0)": 54,
  C: 50,
  "C (GCC 9.2.0)": 50,
  "Java": 62,
  "Java (OpenJDK 13.0.1)": 62,
  "JavaScript": 63,
  javascript: 63,
  "JavaScript (Node.js 12.14.0)": 63,
  "Python": 71,
  python: 71,
  "Python (3.8.1)": 71,
});

export function getJudge0LanguageId(language) {
  const id = languageIds[language];
  if (!id) {
    throw new ApiError(400, `Unsupported Judge0 language: ${language}`);
  }
  return id;
}

function encodeBase64(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

export async function submitSubmission({
  language,
  sourceCode,
  testCases,
  timeLimitMs,
  memoryLimitMb,
  signal,
}) {
  const languageId = getJudge0LanguageId(language);
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new ApiError(400, "At least one test case is required.");
  }

  const tokens = [];
  for (let offset = 0; offset < testCases.length; offset += 20) {
    const submissions = testCases.slice(offset, offset + 20).map((testCase) => ({
      language_id: languageId,
      source_code: encodeBase64(sourceCode),
      stdin: encodeBase64(testCase.input),
      expected_output: encodeBase64(testCase.expectedOutput),
      cpu_time_limit: Math.max(0.1, timeLimitMs / 1000),
      memory_limit: memoryLimitMb * 1024,
    }));
    const response = await judge0Request(
      "submissions/batch?base64_encoded=true&wait=false",
      { method: "POST", body: { submissions }, signal },
    );

    if (
      !Array.isArray(response) ||
      response.length !== submissions.length ||
      response.some((item) => typeof item?.token !== "string")
    ) {
      throw new Error("Judge0 returned an unexpected batch submission response.");
    }
    tokens.push(...response.map((item) => item.token));
  }
  return { tokens, languageId };
}

export async function getSubmissionResult(token, { signal } = {}) {
  if (typeof token !== "string" || !token.trim()) {
    throw new TypeError("Judge0 submission token is required.");
  }
  return judge0Request(
    `submissions/${encodeURIComponent(token)}?base64_encoded=true&fields=*`,
    { signal },
  );
}

export async function getBatchSubmissionResults(tokens, { signal } = {}) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new TypeError("tokens must be a non-empty array of Judge0 tokens.");
  }
  if (tokens.some((token) => typeof token !== "string" || !token.trim())) {
    throw new TypeError("Every Judge0 token must be a non-empty string.");
  }
  const batches = [];
  for (let offset = 0; offset < tokens.length; offset += 20) {
    const query = new URLSearchParams({
      tokens: tokens.slice(offset, offset + 20).join(","),
      base64_encoded: "true",
      fields: "*",
    });
    const batch = await judge0Request(`submissions/batch?${query}`, { signal });
    if (!Array.isArray(batch)) {
      throw new Error("Judge0 returned an unexpected batch result response.");
    }
    batches.push(...batch);
  }
  return batches;
}

export async function getLanguageList({ signal } = {}) {
  return judge0Request("languages", { signal });
}

export default {
  getJudge0LanguageId,
  submitSubmission,
  getSubmissionResult,
  getBatchSubmissionResults,
  getLanguageList,
};