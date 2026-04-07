const express = require("express");
const swaggerUi = require("swagger-ui-express");
const { openApiSpec } = require("./openapi");

const router = express.Router();

router.get("/openapi.json", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(openApiSpec);
});

router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Ghoomo API Docs",
    swaggerOptions: {
      docExpansion: "list",
      persistAuthorization: true,
    },
  })
);

module.exports = router;