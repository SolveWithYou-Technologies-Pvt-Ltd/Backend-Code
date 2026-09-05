const JobApplication = require("../models/jobApplicationModel");
const {
  sendApplicationSubmittedEmail,
  sendApplicationUpdatedEmail,
  sendApplicationDeletedEmail,
} = require("../services/emails/jobApplicationEmailSender");

exports.submitApplication = async (req, res) => {
  try {
    const applicationId = "APP-" + Date.now().toString().slice(-4) + Math.floor(1000 + Math.random() * 9000);
    const finalCreatedBy = req.body.createdBy || "User";
    const applicationData = { ...req.body, applicationId, createdBy: finalCreatedBy };
    
    const application = await JobApplication.create(applicationData);

    if (application.email) {
      sendApplicationSubmittedEmail(application.email, application.fullName || "Candidate", applicationId, finalCreatedBy);
    }

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, viewMode, search, status, appliedRole, experienceLevel } = req.query;
    const query = {};

    if (viewMode === "job") query.isGeneral = false;
    if (viewMode === "direct") query.isGeneral = true;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { applicationId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (status && status !== "All") query.status = status;
    if (appliedRole) query.appliedRole = { $regex: appliedRole, $options: "i" };
    if (experienceLevel && experienceLevel !== "All") query.experienceLevel = experienceLevel;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await JobApplication.find(query)
      .populate("jobId", "title department location type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await JobApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUniqueAppliedRoles = async (req, res) => {
  try {
    const roles = await JobApplication.distinct("appliedRole");
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id).populate("jobId");
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.email) {
      sendApplicationUpdatedEmail(application.email, application.fullName || "Candidate", application.applicationId, application.status);
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const application = await JobApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (application.email) {
      sendApplicationDeletedEmail(application.email, application.fullName || "Candidate", application.applicationId);
    }

    res.status(200).json({ success: true, message: "Application deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};