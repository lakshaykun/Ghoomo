const logger = require("../utils/logger");
const { AppError } = require("../utils/helpers");

function notFound(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, "ROUTE_NOT_FOUND"));
}

function mapDatabaseError(error) {
  if (!error || !error.code) {
    return null;
  }

  if (error.code === "23505") {
    return new AppError("Duplicate value violates unique constraint", 409, "DUPLICATE_RESOURCE", {
      detail: error.detail,
      constraint: error.constraint,
    });
  }

  if (error.code === "23503") {
    return new AppError("Referenced resource does not exist", 400, "FOREIGN_KEY_VIOLATION", {
      detail: error.detail,
      constraint: error.constraint,
    });
  }

  if (error.code === "22P02") {
    return new AppError("Invalid identifier or field format", 400, "INVALID_TEXT_REPRESENTATION", {
      detail: error.detail,
    });
  }

  return null;
}

function errorHandler(error, req, res, next) {
  const normalizedError = mapDatabaseError(error) || error;

  const appError =
    normalizedError instanceof AppError
      ? normalizedError
      : new AppError(normalizedError.message || "Internal server error", 500, "INTERNAL_ERROR");

  if (appError.statusCode >= 500) {
    logger.error("Unhandled server error", {
      path: req.originalUrl,
      method: req.method,
      code: appError.code,
      message: appError.message,
      stack: normalizedError.stack,
    });
  } else {
    logger.warn("Handled request error", {
      path: req.originalUrl,
      method: req.method,
      code: appError.code,
      message: appError.message,
    });
  }

  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  notFound,
  errorHandler,
};
