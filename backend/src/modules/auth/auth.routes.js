const express = require("express");
const controller = require("./auth.controller");
const { authenticate } = require("../../common/middleware/auth.middleware");

const router = express.Router();

router.post("/register", controller.register);
router.post("/signup", controller.register);
router.post("/login", controller.login);

// Backward compatible placeholders from the legacy monolith API.
router.post("/google-login", controller.notImplementedSocialLogin);
router.post("/firebase-login", controller.notImplementedSocialLogin);

router.get("/me", authenticate, controller.me);

module.exports = router;
