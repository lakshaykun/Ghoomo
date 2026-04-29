const express = require("express");
const controller = require("./driver.controller");
const { authenticate, requireRole } = require("../../common/middleware/auth.middleware");

const router = express.Router();

// Public lookup used by riders while searching for nearby drivers.
router.get("/nearby", controller.getNearbyDrivers);

router.use(authenticate);

router.post("/register", controller.registerDriver);
router.get("/me", requireRole("driver", "admin"), controller.getProfile);
router.get("/me/active-ride", requireRole("driver", "admin"), controller.getActiveRide);
router.patch("/me/availability", requireRole("driver", "admin"), controller.updateAvailability);
router.patch("/me/location", requireRole("driver", "admin"), controller.updateLocation);
router.get("/requests", requireRole("driver", "admin"), controller.listCandidateRequests);
router.post("/requests/:requestId/respond", requireRole("driver", "admin"), controller.respondToCandidate);

router.get("/scheduled-rides", requireRole("driver", "admin"), controller.getScheduledRides);

module.exports = router;
