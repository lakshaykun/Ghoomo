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

function validateAnalyticsQuery(query = {}) {
  const days = Number(query.days || 7);
  const limit = Number(query.limit || 5);

  const errors = [];
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    errors.push({ field: "days", message: "days must be a positive integer between 1 and 30" });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    errors.push({ field: "limit", message: "limit must be a positive integer between 1 and 20" });
  }

  return {
    isValid: errors.length === 0,
    errors,
    days,
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
  validateAnalyticsQuery,
  validateDriverStatusPayload,
};
