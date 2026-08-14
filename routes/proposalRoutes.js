const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { 
  createProposal, 
  getAllProposals,
  getProposalById,
  getProposalByQuoteId,
  updateProposalStatus,
  updateProposal,
  deleteProposal
} = require("../controllers/proposalController");

router.use(verifyToken);
router.route("/").get(getAllProposals).post(createProposal);
router.route("/:id").get(getProposalById).put(updateProposal).delete(deleteProposal);
router.route("/quote/:quoteId").get(getProposalByQuoteId);
router.route("/:id/status").patch(updateProposalStatus);

module.exports = router;