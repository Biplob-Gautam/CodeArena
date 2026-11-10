import ApiError from "../utils/ApiError.js";

const requestSources = new Set(["body", "params", "query", "headers"]);

export function validate(schema, source = "body") {
  if (!schema || typeof schema.safeParse !== "function") {
    throw new TypeError("validate expects a Zod schema.");
  }
  if (!requestSources.has(source)) {
    throw new RangeError("source must be body, params, query, or headers.");
  }

  return function validateRequest(req, res, next) {
    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));
      return next(new ApiError(400, "Request validation failed.", details));
    }

    req.validated ??= {};
    req.validated[source] = parsed.data;

    if (source === "body") {
      req.body = parsed.data;
    } else if (source === "params") {
      req.params = parsed.data;
    }

    return next();
  };
}

export function validateRequest(schemas) {
  if (!schemas || typeof schemas !== "object" || Array.isArray(schemas)) {
    throw new TypeError("validateRequest expects an object of request schemas.");
  }

  const validators = Object.entries(schemas).map(([source, schema]) =>
    validate(schema, source),
  );

  return function validateRequestMiddleware(req, res, next) {
    let index = 0;

    function runNext(error) {
      if (error) {
        return next(error);
      }

      const validator = validators[index++];
      if (!validator) {
        return next();
      }

      return validator(req, res, runNext);
    }

    return runNext();
  };
}

export default validate;