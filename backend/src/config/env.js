const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function parseCorsOrigins(value) {
  if (!value || value === "*") {
    return ["*"];
  }

  return String(value)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",
  port: toNumber(process.env.PORT, 4000),
  host: process.env.HOST || "0.0.0.0",

  databaseUrl: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: toNumber(process.env.DB_PORT, 5432),
  dbName: process.env.DB_NAME || "ghoomo",
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD || "",
  pgSsl: toBoolean(process.env.PGSSL, true),
  pgSslRejectUnauthorized: toBoolean(process.env.PGSSL_REJECT_UNAUTHORIZED, false),
  pgPoolMax: toNumber(process.env.PG_POOL_MAX, 20),
  pgIdleTimeoutMs: toNumber(process.env.PG_IDLE_TIMEOUT_MS, 30000),
  pgConnectTimeoutMs: toNumber(process.env.PG_CONNECT_TIMEOUT_MS, 10000),

  jwtSecret: process.env.JWT_SECRET || "change_me_to_a_long_random_string_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",

  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN || "*"),
  placeSearchTimeoutMs: toNumber(process.env.PLACE_SEARCH_TIMEOUT_MS, 6000),

  autoMigrateOnStart: toBoolean(process.env.AUTO_MIGRATE_ON_START, false),
};

module.exports = env;
