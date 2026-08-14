const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  proposalId: {
    type: String,
    required: true,
    unique: true
  },
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quote",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  totalCost: {
    type: String,
    required: true
  },
  estimatedTimeline: {
    type: String,
    required: true
  },
  scope: [{
    type: String,
    required: true
  }],
  milestones: [{
    phase: { type: String, required: true },
    amount: { type: String, required: true },
    status: { type: String, required: true }
  }],
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending"
  },
  createdBy: {
    type: String,
    required: true
  },
  creatorEmployeeId: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Proposal", proposalSchema);