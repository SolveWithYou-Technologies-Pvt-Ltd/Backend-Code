const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    isGeneral: {
      type: Boolean,
      default: false,
    },
    appliedRole: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ["Fresher", "Experienced"],
      required: true,
    },
    currentSalary: {
      type: String,
      trim: true,
    },
    expectedSalary: {
      type: String,
      required: true,
      trim: true,
    },
    resumeLink: {
      type: String,
      required: true,
    },
    portfolioLink: {
      type: String,
    },
    coverLetter: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Shortlisted", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);