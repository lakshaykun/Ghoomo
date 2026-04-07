const express = require("express");
const controller = require("./bus.controller");
const { authenticate, requireRole } = require("../../common/middleware/auth.middleware");

const router = express.Router();

// Modern modular endpoints
router.get("/bus/routes", controller.listRoutes);
router.post("/bus/routes", authenticate, requireRole("admin"), controller.createRoute);
router.post("/bus/routes/:routeId/stops", authenticate, requireRole("admin"), controller.addRouteStop);

router.get("/bus/bookings", authenticate, controller.listBookings);
router.post("/bus/bookings", authenticate, controller.createBooking);
router.patch(
  "/bus/bookings/:bookingId/status",
  authenticate,
  requireRole("admin", "driver", "bus_driver"),
  controller.updateBookingStatus
);

module.exports = router;
