const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  quoteId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true
  },
  currency: {
    type: String,
    enum: ["INR", "USD"],
    default: "INR"
  },
  budget: {
    type: String,
    required: false
  },
  timeline: {
    type: String,
    required: false
  },
  projectTitle: {
    type: String,
    required: true
  },
  projectDescription: {
    type: String,
    required: true
  },
  referenceLinks: {
    type: String,
    required: false
  },
  facilities: [{
    type: String
  }],
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Rejected"],
    default: "Pending"
  },
  createdBy: {
    type: String,
    default: "User"
  },
  creatorEmployeeId: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Quote", quoteSchema);