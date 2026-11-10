export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);

    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
      throw new RangeError("statusCode must be an integer between 400 and 599.");
    }
    if (typeof message !== "string" || message.trim().length === 0) {
      throw new TypeError("message must be a non-empty string.");
    }

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = true;

    if (details !== undefined) {
      this.details = details;
    }

    Error.captureStackTrace?.(this, ApiError);
  }
}

export default ApiError;