const express = require("express");
const controller = require("./admin.controller");
const { authenticate, requireRole } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, requireRole("admin"));

router.get("/dashboard", controller.getDashboardStats);
router.get("/analytics", controller.getAnalytics);
router.get("/health", controller.getHealth);
router.get("/users", controller.getUsers);
router.get("/rides", controller.getRides);

router.patch("/drivers/:driverId/status", controller.updateDriverStatus);
router.patch("/drivers/:driverId/suspend", (req, res, next) => {
  req.body = {
    ...(req.body || {}),
    status: "suspended",
  };
  return controller.updateDriverStatus(req, res, next);
});

module.exports = router;
