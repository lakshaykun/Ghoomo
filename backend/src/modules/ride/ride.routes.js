const express = require("express");
const controller = require("./ride.controller");
const { authenticate, requireRole } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router.post("/quote", controller.quote);

router.use(authenticate);

router.post("/", controller.createLegacyRide);
router.post("/requests", controller.createRequest);
router.get("/requests/:requestId", controller.getRequest);
router.patch("/requests/:requestId/cancel", controller.cancelRequest);
router.post("/requests/:requestId/assign", requireRole("admin", "driver"), controller.assignDriver);

router.get("/history", controller.getMyHistory);
router.get("/history/:userId", controller.getHistoryByUserId);

router.get("/shared", controller.getAvailableSharedRides);

router.get("/:rideId", controller.getRide);
router.post("/:rideId/join", controller.joinSharedRide);
router.post("/:rideId/leave", controller.leaveSharedRide);
router.post("/:rideId/accept", requireRole("driver", "admin"), controller.acceptRide);
router.patch("/:rideId/status", requireRole("driver", "admin"), controller.updateRideStatus);
router.post("/:rideId/verify-otp", requireRole("driver"), controller.verifyOtp);
router.post("/requests/:requestId/reject", requireRole("driver"), controller.rejectRideRequest);
router.post("/:rideId/rate", controller.rateRide);

module.exports = router;
