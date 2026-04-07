const fs = require("fs");
const path = require("path");
const { pool, withTransaction } = require("../config/db");
const logger = require("../common/utils/logger");

const migrationsDir = path.resolve(__dirname, "migrations");

function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));
}

async function runSchemaMigration() {
  const migrationFiles = getMigrationFiles();

  if (migrationFiles.length === 0) {
    throw new Error(`No SQL migration files found in ${migrationsDir}`);
  }

  await withTransaction(async (client) => {
    for (const fileName of migrationFiles) {
      const filePath = path.join(migrationsDir, fileName);
      const sql = fs.readFileSync(filePath, "utf8");
      await client.query(sql);
      logger.info("Database migration executed", { fileName });
    }
  });

  logger.info("Database migrations completed", { migrationCount: migrationFiles.length });
}

if (require.main === module) {
  runSchemaMigration()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      logger.error("Database schema migration failed", { error: error.message, stack: error.stack });
      await pool.end();
      process.exit(1);
    });
}

module.exports = {
  runSchemaMigration,
  getMigrationFiles,
};
