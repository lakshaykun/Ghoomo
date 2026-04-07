const { AppError, asyncHandler } = require("../../common/utils/helpers");
const { validateRegisterPayload, validateLoginPayload } = require("./auth.schema");
const authService = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const validation = validateRegisterPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const validation = validateLoginPayload(req.body);
  if (!validation.isValid) {
    throw new AppError("Validation failed", 400, "VALIDATION_ERROR", validation.errors);
  }

  const result = await authService.login(req.body);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

const notImplementedSocialLogin = asyncHandler(async (req, res) => {
  throw new AppError(
    "Google/Firebase login endpoints are not implemented in the modular refactor yet",
    501,
    "NOT_IMPLEMENTED"
  );
});

module.exports = {
  register,
  login,
  me,
  notImplementedSocialLogin,
};
