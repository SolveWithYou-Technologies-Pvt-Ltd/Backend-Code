const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["credit", "expense"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String,
    default: ""
  },
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    fullName: {
      type: String,
      required: true
    },
    employeeCode: {
      type: String,
      default: ""
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);