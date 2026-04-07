const express = require("express");
const controller = require("./sharedRide.controller");
const { authenticate, requireRole } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router.get("/", controller.listSharedRides);
router.get("/:sharedRideId", controller.getSharedRide);

router.use(authenticate);

router.post("/", controller.createSharedRide);
router.post("/:sharedRideId/join", controller.joinSharedRide);
router.patch("/:sharedRideId/status", requireRole("driver", "admin"), controller.updateStatus);

module.exports = router;
