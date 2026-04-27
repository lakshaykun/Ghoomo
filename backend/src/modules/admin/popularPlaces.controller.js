const { asyncHandler } = require("../../common/utils/helpers");
const service = require("./popularPlaces.service");

// GET /admin/popular-places
const listPlaces = asyncHandler(async (_req, res) => {
  const places = await service.getPopularPlaces();
  res.status(200).json({ success: true, data: places });
});

// POST /admin/popular-places
const addPlace = asyncHandler(async (req, res) => {
  const place = await service.createPlace(req.body);
  res.status(201).json({ success: true, data: place, message: "Place created" });
});

// PUT /admin/popular-places/:id
const editPlace = asyncHandler(async (req, res) => {
  const place = await service.updatePlace(req.params.id, req.body);
  res.status(200).json({ success: true, data: place, message: "Place updated" });
});

// DELETE /admin/popular-places/:id
const removePlace = asyncHandler(async (req, res) => {
  await service.deletePlace(req.params.id);
  res.status(200).json({ success: true, message: "Place deleted" });
});

module.exports = { listPlaces, addPlace, editPlace, removePlace };
