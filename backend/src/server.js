const http = require("http");
const app = require("./app");
const { initializeWebSocket } = require("./common/utils/socket");
const env = require("./config/env");
const logger = require("./common/utils/logger");
const rideService = require("./modules/ride/ride.service");
const { healthCheck } = require("./config/db");
const { runSchemaMigration } = require("./db/migrate");

async function startServer() {
  if (env.autoMigrateOnStart) {
    await runSchemaMigration();
  }

  await healthCheck();

  const server = http.createServer(app);
  initializeWebSocket(server);
  await new Promise((resolve) => {
    server.listen(env.port, env.host, () => {
      logger.info("Server started", {
        host: env.host,
        port: env.port,
        environment: env.nodeEnv,
      });
      resolve();
    });
  });

  // Start background jobs
  setInterval(async () => {
    try {
      await rideService.processStaleRides();
    } catch (err) {
      logger.error("Error in stale rides background job", err);
    }
  }, 60000); // Every minute

  return server;
}

function vercelHandler(req, res) {
  return app(req, res);
}

module.exports = {
  app,
  startServer,
  vercelHandler,
};
