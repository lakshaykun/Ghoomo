const repository = require("./auth.repository");
const {
  AppError,
  hashPassword,
  normalizeRole,
  verifyPassword,
  signAuthToken,
  sanitizeUser,
} = require("../../common/utils/helpers");

async function register(payload) {
  const email = String(payload.email).trim().toLowerCase();
  const phone = String(payload.phone).trim();
  const requestedRole = normalizeRole(payload.role || "rider");

  if (requestedRole !== "rider") {
    throw new AppError("Public signup supports only the rider role", 403, "ROLE_NOT_ALLOWED");
  }

  const [existingByEmail, existingByPhone] = await Promise.all([
    repository.findByEmail(email),
    repository.findByPhone(phone),
  ]);

  if (existingByEmail) {
    throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_EXISTS");
  }

  if (existingByPhone) {
    throw new AppError("Phone is already registered", 409, "PHONE_ALREADY_EXISTS");
  }

  const user = await repository.createUser({
    name: String(payload.name).trim(),
    email,
    phone,
    passwordHash: hashPassword(payload.password),
    role: "rider",
  });

  const token = signAuthToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
}

async function login(payload) {
  const email = String(payload.email).trim().toLowerCase();
  const user = await repository.findByEmail(email);

  if (!user || !verifyPassword(payload.password, user.password_hash)) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const token = signAuthToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
}

async function getCurrentUser(userId) {
  const user = await repository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  return sanitizeUser(user);
}

module.exports = {
  register,
  login,
  getCurrentUser,
};
