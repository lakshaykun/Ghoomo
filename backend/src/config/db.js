const { Pool } = require("pg");
const env = require("./env");
const logger = require("../common/utils/logger");

const connectionOptions = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
    }
  : {
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPassword,
    };

if (env.pgSsl) {
  connectionOptions.ssl = { rejectUnauthorized: env.pgSslRejectUnauthorized };
}

const pool = new Pool({
  ...connectionOptions,
  max: env.pgPoolMax,
  idleTimeoutMillis: env.pgIdleTimeoutMs,
  connectionTimeoutMillis: env.pgConnectTimeoutMs,
});

pool.on("error", (error) => {
  logger.error("Unexpected PostgreSQL pool error", { error: error.message });
});

async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    logger.debug("SQL executed", {
      durationMs: Date.now() - start,
      rowCount: result.rowCount,
      statement: text.split("\n")[0].trim(),
    });
    return result;
  } catch (error) {
    logger.error("SQL execution failed", {
      durationMs: Date.now() - start,
      statement: text,
      params,
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function healthCheck() {
  await query("SELECT 1 AS ok");
  return true;
}

module.exports = {
  pool,
  query,
  withTransaction,
  healthCheck,
};
