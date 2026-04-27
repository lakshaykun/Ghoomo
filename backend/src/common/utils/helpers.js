const crypto = require("crypto");
const env = require("../../config/env");
const { haversineDistance } = require("./distance");

class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR", details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function pick(source, keys) {
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      acc[key] = source[key];
    }
    return acc;
  }, {});
}

function parseDurationToSeconds(value) {
  if (!value) {
    return 24 * 60 * 60;
  }

  const raw = String(value).trim().toLowerCase();
  const exactNumber = Number(raw);
  if (Number.isFinite(exactNumber)) {
    return exactNumber;
  }

  const match = raw.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    return 24 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * multipliers[unit];
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const padding = 4 - (value.length % 4 || 4);
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padding);
  return Buffer.from(normalized, "base64").toString("utf8");
}

function signSegment(segment) {
  return crypto
    .createHmac("sha256", env.jwtSecret)
    .update(segment)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signAuthToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = parseDurationToSeconds(env.jwtExpiresIn);

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    })
  );

  const signature = signSegment(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

function verifyAuthToken(token) {
  if (!token || typeof token !== "string") {
    throw new AppError("Missing auth token", 401, "AUTH_TOKEN_MISSING");
  }

  const segments = token.split(".");
  if (segments.length !== 3) {
    throw new AppError("Invalid auth token", 401, "AUTH_TOKEN_INVALID");
  }

  const [header, body, signature] = segments;
  const expectedSignature = signSegment(`${header}.${body}`);

  const incomingBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    incomingBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(incomingBuffer, expectedBuffer)
  ) {
    throw new AppError("Invalid auth token signature", 401, "AUTH_TOKEN_SIGNATURE_INVALID");
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(body));
  } catch (error) {
    throw new AppError("Invalid auth token payload", 401, "AUTH_TOKEN_INVALID_PAYLOAD");
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    throw new AppError("Auth token expired", 401, "AUTH_TOKEN_EXPIRED");
  }

  return payload;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const keyLength = 64;
  const digest = "sha512";
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
  return `${iterations}:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [iterationsRaw, salt, expectedHash] = String(storedHash || "").split(":");
  const iterations = Number(iterationsRaw);

  if (!iterations || !salt || !expectedHash) {
    return false;
  }

  const keyLength = expectedHash.length / 2;
  const digest = "sha512";
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");

  const incomingBuffer = Buffer.from(hash);
  const expectedBuffer = Buffer.from(expectedHash);

  if (incomingBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(incomingBuffer, expectedBuffer);
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password_hash, ...safe } = user;
  return safe;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  return haversineDistance(lat1, lon1, lat2, lon2);
}

function toFiniteNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const ROLE_ALIASES = {
  user: "rider",
  rider: "rider",
  driver: "driver",
  bus_driver: "bus_driver",
  admin: "admin",
};

function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return ROLE_ALIASES[normalized] || null;
}

module.exports = {
  AppError,
  asyncHandler,
  pick,
  signAuthToken,
  verifyAuthToken,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  calculateDistanceKm,
  toFiniteNumber,
  normalizeRole,
};
