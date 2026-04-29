const { app, startServer, vercelHandler } = require("./src/server");

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

module.exports = vercelHandler;
module.exports.app = app;
module.exports.startServer = startServer;
module.exports.vercelHandler = vercelHandler;
