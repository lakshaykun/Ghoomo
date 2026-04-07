const { normalizeRole } = require("../../common/utils/helpers");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function validateRegisterPayload(payload = {}) {
  const errors = [];

  if (!payload.name || String(payload.name).trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters long" });
  }

  if (!payload.email || !isValidEmail(payload.email)) {
    errors.push({ field: "email", message: "A valid email is required" });
  }

  if (!payload.phone || String(payload.phone).trim().length < 8) {
    errors.push({ field: "phone", message: "A valid phone number is required" });
  }

  if (!payload.password || String(payload.password).length < 8) {
    errors.push({ field: "password", message: "Password must be at least 8 characters long" });
  }

  const requestedRole = normalizeRole(payload.role || "rider");
  if (!requestedRole) {
    errors.push({ field: "role", message: "Role must be one of: rider" });
  } else if (requestedRole !== "rider") {
    errors.push({ field: "role", message: "Public signup supports only the rider role" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateLoginPayload(payload = {}) {
  const errors = [];

  if (!payload.email || !isValidEmail(payload.email)) {
    errors.push({ field: "email", message: "A valid email is required" });
  }

  if (!payload.password || String(payload.password).length < 1) {
    errors.push({ field: "password", message: "Password is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
};
