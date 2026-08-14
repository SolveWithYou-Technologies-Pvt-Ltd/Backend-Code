const JobApplication = require("../models/jobApplicationModel");

exports.submitApplication = async (req, res) => {
  try {
    const applicationId = "APP-" + Date.now().toString().slice(-4) + Math.floor(1000 + Math.random() * 9000);
    const applicationData = { ...req.body, applicationId };
    
    const application = await JobApplication.create(applicationData);
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find()
      .populate("jobId", "title department location type")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: applications });
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
    res.status(200).json({ success: true, message: "Application deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};