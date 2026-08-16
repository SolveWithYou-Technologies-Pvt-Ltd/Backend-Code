const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { 
  createProposal, 
  getAllProposals,
  getUserProposals,
  getProposalById,
  getProposalByQuoteId,
  updateProposalStatus,
  updateProposal,
  deleteProposal
} = require("../controllers/proposalController");

router.get("/user/me", getUserProposals);
router.get("/quote/:quoteId", getProposalByQuoteId);

router.use(verifyToken);

router.get("/", getAllProposals);
router.post("/", createProposal);
router.get("/:id", getProposalById);
router.put("/:id", updateProposal);
router.delete("/:id", deleteProposal);
router.patch("/:id/status", updateProposalStatus);

module.exports = router;