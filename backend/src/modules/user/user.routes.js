const express = require("express");
const controller = require("./user.controller");
const { authenticate } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/me", controller.getProfile);
router.patch("/me", controller.updateProfile);
router.get("/saved-locations", controller.listSavedLocations);
router.post("/saved-locations", controller.addSavedLocation);
router.delete("/saved-locations/:locationId", controller.removeSavedLocation);

module.exports = router;
