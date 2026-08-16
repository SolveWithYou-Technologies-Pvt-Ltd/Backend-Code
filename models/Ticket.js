const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ClientProjectlist", 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "low" 
  },
  status: { 
    type: String, 
    enum: ["Open", "In Progress", "Resolved"], 
    default: "Open" 
  }
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);