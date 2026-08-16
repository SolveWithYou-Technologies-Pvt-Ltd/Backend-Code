const express = require("express");
const router = express.Router();
const { getUserDashboardData } = require("../controllers/userDashboardController");

router.get("/me", getUserDashboardData);

module.exports = router;