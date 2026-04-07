function validatePaginationQuery(query = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);

  const errors = [];
  if (!Number.isInteger(page) || page < 1) {
    errors.push({ field: "page", message: "page must be a positive integer" });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    errors.push({ field: "limit", message: "limit must be a positive integer between 1 and 100" });
  }

  return {
    isValid: errors.length === 0,
    errors,
    page,
    limit,
  };
}

function validateDriverStatusPayload(payload = {}) {
  const errors = [];

  if (!payload.status || !["approved", "pending", "suspended"].includes(payload.status)) {
    errors.push({ field: "status", message: "status must be one of approved, pending, suspended" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validatePaginationQuery,
  validateDriverStatusPayload,
};
