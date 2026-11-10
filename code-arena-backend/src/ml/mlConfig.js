import "dotenv/config";

const baseURL = process.env.ML_SERVICE_URL || "http://localhost:8000";
let parsedBaseURL;

try {
  parsedBaseURL = new URL(baseURL);
} catch (error) {
  throw new Error("ML_SERVICE_URL must be a valid URL.", { cause: error });
}

if (!["http:", "https:"].includes(parsedBaseURL.protocol)) {
  throw new Error("ML_SERVICE_URL must use HTTP or HTTPS.");
}

const mlConfig = Object.freeze({
  baseURL: parsedBaseURL.href.replace(/\/+$/, ""),
  timeout: 10000,
});

export default mlConfig;