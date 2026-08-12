const express = require("express");

const {
  getServices,
  getServiceByIdentifier,
} = require("../controllers/serviceController");

const router = express.Router();

router.get("/", getServices);
router.get("/:identifier", getServiceByIdentifier);

module.exports = router;
