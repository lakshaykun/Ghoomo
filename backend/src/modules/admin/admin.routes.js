const express = require("express");
const controller = require("./admin.controller");
const popularPlacesController = require("./popularPlaces.controller");
const { authenticate, requireRole } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router.use(authenticate, requireRole("admin"));

router.get("/dashboard", controller.getDashboardStats);
router.get("/analytics", controller.getAnalytics);
router.get("/health", controller.getHealth);
router.get("/users", controller.getUsers);
router.get("/rides", controller.getRides);
router.get("/campus-boundary", controller.getCampusBoundary);
router.post("/campus-boundary", controller.createCampusBoundary);
router.put("/campus-boundary", controller.updateCampusBoundary);
router.get("/drivers/live", controller.getLiveDrivers);

router.patch("/drivers/:driverId/status", controller.updateDriverStatus);
router.patch("/drivers/:driverId/suspend", (req, res, next) => {
  req.body = {
    ...(req.body || {}),
    status: "suspended",
  };
  return controller.updateDriverStatus(req, res, next);
});

// Popular places CRUD
router.get("/popular-places", popularPlacesController.listPlaces);
router.post("/popular-places", popularPlacesController.addPlace);
router.put("/popular-places/:id", popularPlacesController.editPlace);
router.delete("/popular-places/:id", popularPlacesController.removePlace);

module.exports = router;

