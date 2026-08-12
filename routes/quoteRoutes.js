const express = require("express");
const router = express.Router();
const { createQuote } = require("../controllers/quoteController");

router.post("/", createQuote);

module.exports = router;