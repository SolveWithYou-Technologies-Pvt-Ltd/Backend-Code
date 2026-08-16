const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { 
  createTicket, 
  getUserTickets, 
  getAllTickets, 
  getTicketById, 
  updateTicket, 
  deleteTicket, 
  updateTicketStatus 
} = require("../controllers/ticketController");

router.post("/", createTicket);
router.get("/user/me", getUserTickets);

router.use(verifyToken);
router.get("/", getAllTickets);
router.get("/:id", getTicketById);
router.put("/:id", updateTicket);
router.delete("/:id", deleteTicket);
router.patch("/:id/status", updateTicketStatus);

module.exports = router;