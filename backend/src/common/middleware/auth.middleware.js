const { AppError, normalizeRole, verifyAuthToken } = require("../utils/helpers");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authorization token is required", 401, "AUTH_REQUIRED"));
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = {
      id: payload.sub,
      role: normalizeRole(payload.role) || String(payload.role || "").trim().toLowerCase() || null,
      email: payload.email,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    }

    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};
