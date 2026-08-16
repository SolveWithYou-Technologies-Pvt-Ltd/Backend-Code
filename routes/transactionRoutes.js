const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { 
  createTransaction, 
  getTransactions, 
  getTransactionStats, 
  getTransactionById, 
  updateTransaction,
  deleteTransaction 
} = require("../controllers/transactionController");

router.use(verifyToken);

router.get("/stats", getTransactionStats);
router.get("/", getTransactions);
router.post("/", createTransaction);
router.get("/:id", getTransactionById);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;