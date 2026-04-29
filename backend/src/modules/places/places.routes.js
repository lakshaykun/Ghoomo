const express = require("express");
const { asyncHandler } = require("../../common/utils/helpers");
const service = require("../admin/popularPlaces.service");
const controller = require("./places.controller");

const router = express.Router();

// Public — no auth required
// GET /api/places/popular
router.get("/popular", asyncHandler(async (_req, res) => {
  const places = await service.getPopularPlaces();
  // Only expose fields the app needs; no timestamps
  const payload = places.map(({ id, name, address, latitude, longitude }) => ({
    id, name, address, latitude, longitude,
  }));
  res.status(200).json({ success: true, data: payload });
}));

router.get("/search", controller.searchPlaces);

module.exports = router;
