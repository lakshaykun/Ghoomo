function formatMessage(level, message, meta) {
  const payload = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(meta && typeof meta === "object" ? { meta } : {}),
  };

  return JSON.stringify(payload);
}

function info(message, meta) {
  console.log(formatMessage("info", message, meta));
}

function warn(message, meta) {
  console.warn(formatMessage("warn", message, meta));
}

function error(message, meta) {
  console.error(formatMessage("error", message, meta));
}

function debug(message, meta) {
  if ((process.env.NODE_ENV || "development") !== "production") {
    console.debug(formatMessage("debug", message, meta));
  }
}

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    info("HTTP request", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
}

module.exports = {
  info,
  warn,
  error,
  debug,
  requestLogger,
};
