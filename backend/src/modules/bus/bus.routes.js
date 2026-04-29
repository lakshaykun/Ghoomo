const express = require("express");
const controller = require("./bus.controller");
const { authenticate, requireRole } = require("../../common/middleware/auth.middleware");

const router = express.Router();

// Modern modular endpoints
router.get("/bus/routes", controller.listRoutes);
router.post("/bus/routes", authenticate, requireRole("admin"), controller.createRoute);
router.put("/bus/routes/:routeId", authenticate, requireRole("admin"), controller.updateRoute);
router.delete("/bus/routes/:routeId", authenticate, requireRole("admin"), controller.deleteRoute);
router.post("/bus/routes/:routeId/stops", authenticate, requireRole("admin"), controller.addRouteStop);
router.get("/bus/routes/:routeId/tracking", authenticate, controller.getRouteTracking);
router.patch(
  "/bus/routes/:routeId/location",
  authenticate,
  requireRole("admin", "bus_driver", "driver"),
  controller.updateRouteLocation
);

router.get("/bus/bookings", authenticate, controller.listBookings);
router.post("/bus/bookings", authenticate, controller.createBooking);
router.patch(
  "/bus/bookings/:bookingId/status",
  authenticate,
  controller.updateBookingStatus
);

router.get("/admin/bus-drivers", authenticate, requireRole("admin"), controller.listApprovedBusDrivers);

module.exports = router;
