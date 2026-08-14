const Proposal = require("../models/Proposal");
const Quote = require("../models/Quote");

exports.createProposal = async (req, res) => {
  try {
    const { quoteId, title, validUntil, totalCost, estimatedTimeline, scope, milestones, createdBy, creatorEmployeeId } = req.body;

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSlice = Date.now().toString().slice(-6);
    const generatedProposalId = `PRP-${timestampSlice}-${randomSuffix}`;

    const newProposal = new Proposal({
      proposalId: generatedProposalId,
      quote: quoteId,
      title,
      validUntil,
      totalCost,
      estimatedTimeline,
      scope,
      milestones,
      createdBy: createdBy || "Admin",
      creatorEmployeeId: creatorEmployeeId || ""
    });

    await newProposal.save();

    quote.status = "In Progress";
    await quote.save();

    res.status(201).json({
      success: true,
      message: "Proposal generated successfully",
      data: newProposal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllProposals = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { proposalId: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { createdBy: { $regex: search, $options: "i" } },
        { creatorEmployeeId: { $regex: search, $options: "i" } }
      ];
    }

    const proposals = await Proposal.find(query)
      .select("proposalId title totalCost validUntil status createdBy creatorEmployeeId createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate("quote");
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProposalByQuoteId = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ quote: req.params.quoteId });
    if (!proposal) {
      return res.status(200).json({ success: true, data: null, message: "Proposal not generated yet" });
    }
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }
    
    if (status === "Accepted") {
      await Quote.findByIdAndUpdate(proposal.quote, { status: "Completed" });
    } else if (status === "Rejected") {
      await Quote.findByIdAndUpdate(proposal.quote, { status: "Rejected" });
    }

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }
    res.status(200).json({ success: true, message: "Proposal deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};