const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { 
  createQuote, 
  getAllQuotes,
  getUserQuotes,
  getQuoteById, 
  updateQuoteStatus, 
  updateQuote, 
  deleteQuote 
} = require("../controllers/quoteController");

router.post("/", createQuote);
router.route("/user/me").get(getUserQuotes);
router.use(verifyToken);

router.route("/").get(getAllQuotes);
router.route("/:id").get(getQuoteById).put(updateQuote).delete(deleteQuote);
router.route("/:id/status").patch(updateQuoteStatus);

module.exports = router;