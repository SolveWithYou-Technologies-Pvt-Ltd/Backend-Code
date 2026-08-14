const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance"],
    },
    experience: {
      type: String,
      required: true,
    },
    vacancies: {
      type: Number,
      required: true,
      default: 1,
    },
    minSalary: {
      type: Number,
    },
    maxSalary: {
      type: Number,
    },
    stipend: {
      type: Number,
    },
    internshipType: {
      type: String,
      enum: ["Paid", "Unpaid", ""],
      default: "",
    },
    duration: {
      type: String,
      trim: true,
    },
    promotionAfterInternship: {
      type: String,
      enum: ["Yes", "No", ""],
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);