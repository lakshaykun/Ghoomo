const { asyncHandler } = require("../../common/utils/helpers");
const service = require("./places.service");

const searchPlaces = asyncHandler(async (req, res) => {
  const query = String(req.query.query || req.query.q || "").trim();
  const limit = Number(req.query.limit) || 8;
  const places = await service.searchPlaces(query, limit);
  res.status(200).json({
    success: true,
    data: places,
  });
});

module.exports = {
  searchPlaces,
};
