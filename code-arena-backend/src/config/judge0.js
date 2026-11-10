import "dotenv/config";

const apiUrl = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
let parsedApiUrl;

try {
  parsedApiUrl = new URL(apiUrl);
} catch (error) {
  throw new Error("JUDGE0_API_URL must be a valid URL.", { cause: error });
}

if (!["http:", "https:"].includes(parsedApiUrl.protocol)) {
  throw new Error("JUDGE0_API_URL must use HTTP or HTTPS.");
}

const apiKey = process.env.JUDGE0_API_KEY?.trim();
const rapidApiHost = parsedApiUrl.hostname.endsWith(".rapidapi.com")
  ? parsedApiUrl.hostname
  : undefined;

export const judge0Config = Object.freeze({
  apiUrl: parsedApiUrl.href.replace(/\/+$/, ""),
  apiKey: apiKey || undefined,
  rapidApiHost,
  timeoutMs: 30_000,
});

export async function judge0Request(path, { method = "GET", body, signal } = {}) {
  const requestPath = path.replace(/^\/+/, "");
  const url = new URL(requestPath, `${judge0Config.apiUrl}/`);

  if (url.origin !== parsedApiUrl.origin) {
    throw new Error("Judge0 request paths must stay on the configured API host.");
  }

  const headers = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (judge0Config.apiKey) {
    headers["X-RapidAPI-Key"] = judge0Config.apiKey;
  }
  if (judge0Config.rapidApiHost) {
    headers["X-RapidAPI-Host"] = judge0Config.rapidApiHost;
  }

  const timeoutSignal = AbortSignal.timeout(judge0Config.timeoutMs);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: combinedSignal,
  });

  const responseText = await response.text();
  let responseBody;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = responseText;
  }

  if (!response.ok) {
    const detail =
      typeof responseBody === "string"
        ? responseBody
        : responseBody?.message || responseBody?.error || response.statusText;
    throw new Error(`Judge0 request failed (${response.status}): ${detail}`);
  }

  return responseBody;
}