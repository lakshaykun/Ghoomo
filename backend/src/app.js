const express = require("express");
const env = require("./config/env");
const logger = require("./common/utils/logger");
const { AppError } = require("./common/utils/helpers");
const { requestLogger } = logger;
const { notFound, errorHandler } = require("./common/middleware/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/user/user.routes");
const driverRoutes = require("./modules/driver/driver.routes");
const rideRoutes = require("./modules/ride/ride.routes");
const sharedRideRoutes = require("./modules/sharedRide/sharedRide.routes");
const busRoutes = require("./modules/bus/bus.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const docsRoutes = require("./docs/docs.routes");

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  if (env.corsOrigins.includes("*")) {
    return true;
  }

  return env.corsOrigins.includes(origin);
}

function createCorsMiddleware() {
  return (req, res, next) => {
    const origin = req.headers.origin;

    if (origin && isOriginAllowed(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    if (origin && !isOriginAllowed(origin)) {
      return next(new AppError("Origin is not allowed by CORS", 403, "CORS_BLOCKED"));
    }

    return next();
  };
}

function createApp() {
  const app = express();

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(createCorsMiddleware());
  app.use(requestLogger);

  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Ghoomo backend is running",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(docsRoutes);

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/rides", rideRoutes);
  app.use("/api/shared-rides", sharedRideRoutes);
  app.use("/api/admin", adminRoutes);

  // Mount bus routes under /api and keep /api/bus-routes + /api/bus-bookings compatibility.
  app.use("/api", busRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
