const express = require("express");
const controller = require("./sharedRide.controller");
const { authenticate, requireRole } = require("../../common/middleware/auth.middleware");

const router = express.Router();

// Public routes
router.get("/", controller.listSharedRides);
router.get("/:sharedRideId", controller.getSharedRide);

// Authenticated routes
router.use(authenticate);

router.post("/:sharedRideId/join", controller.joinSharedRide);
router.patch("/:sharedRideId/status", requireRole("driver", "admin"), controller.updateStatus);

module.exports = router;
