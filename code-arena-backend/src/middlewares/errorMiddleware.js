import ApiError from "../utils/ApiError.js";

export function notFoundMiddleware(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const isMalformedJson =
    error instanceof SyntaxError && error.status === 400 && "body" in error;
  const statusCode = isMalformedJson
    ? 400
    : error instanceof ApiError
      ? error.statusCode
      : 500;
  const message = isMalformedJson
    ? "Request body contains invalid JSON."
    : error instanceof ApiError
      ? error.message
      : "An unexpected error occurred.";

  if (statusCode >= 500) {
    console.error("Unhandled request error:", error);
  }

  const response = {
    success: false,
    message,
  };

  if (error instanceof ApiError && error.details !== undefined) {
    response.details = error.details;
  }

  return res.status(statusCode).json(response);
}

export default errorMiddleware;