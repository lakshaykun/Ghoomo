const { AppError, asyncHandler } = require("../../common/utils/helpers");
const userService = require("./user.service");
const { validateUpdateProfilePayload, validateSavedLocationPayload } = require("./user.schema");

const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  res.status(200).json({
    success: true,
    data: profile,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const validation = validateUpdateProfilePayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const profile = await userService.updateProfile(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: "Profile updated",
    data: profile,
  });
});

const listSavedLocations = asyncHandler(async (req, res) => {
  const rows = await userService.listSavedLocations(req.user.id);
  res.status(200).json({
    success: true,
    data: rows,
  });
});

const addSavedLocation = asyncHandler(async (req, res) => {
  const validation = validateSavedLocationPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const location = await userService.addSavedLocation(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: "Saved location added",
    data: location,
  });
});

const removeSavedLocation = asyncHandler(async (req, res) => {
  await userService.removeSavedLocation(req.user.id, req.params.locationId);
  res.status(200).json({
    success: true,
    message: "Saved location removed",
  });
});

module.exports = {
  getProfile,
  updateProfile,
  listSavedLocations,
  addSavedLocation,
  removeSavedLocation,
};
