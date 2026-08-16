const Proposal = require("../models/Proposal");
const Quote = require("../models/Quote");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const {
  sendProposalCreatedEmail,
  sendProposalUpdatedEmail,
  sendProposalDeletedEmail,
} = require("../services/emails/proposalEmailSender");

const extractNumber = (val) => {
  if (!val) return 0;
  const match = String(val).match(/[\d,]+(\.\d+)?/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
};

const getCurrencySymbol = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  const match = str.match(/^[^\d]+/);
  let sym = match ? match[0].trim() : '';
  if (sym === '₹' || sym === 'INR') sym = 'Rs.';
  return sym;
};

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

    let finalTotalCost = totalCost;
    if (milestones && milestones.length > 0) {
      const calculatedTotal = milestones.reduce((sum, m) => sum + extractNumber(m.amount), 0);
      if (calculatedTotal > 0) {
        const currencySym = getCurrencySymbol(milestones[0].amount) || 'Rs.';
        finalTotalCost = `${currencySym} ${calculatedTotal.toLocaleString('en-IN')}`;
      }
    }

    const finalCreatedBy = createdBy || "Admin";

    const newProposal = new Proposal({
      proposalId: generatedProposalId,
      quote: quoteId,
      title,
      validUntil,
      totalCost: finalTotalCost,
      estimatedTimeline,
      scope,
      milestones,
      createdBy: finalCreatedBy,
      creatorEmployeeId: creatorEmployeeId || ""
    });

    await newProposal.save();

    quote.status = "In Progress";
    await quote.save();

    sendProposalCreatedEmail(quote.email, quote.fullName, generatedProposalId, title, finalCreatedBy);

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
      .populate("quote", "quoteId fullName email phoneNumber projectTitle")
      .select("proposalId title totalCost validUntil status createdBy creatorEmployeeId createdAt quote")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserProposals = async (req, res) => {
  try {
    let userEmail = req.query.email && req.query.email !== "undefined" && req.query.email !== "" ? req.query.email : null;
    let userPhone = req.query.phone && req.query.phone !== "undefined" && req.query.phone !== "" ? req.query.phone : null;

    if (!userEmail && !userPhone) {
      let userId = null;

      if (req.user && (req.user.id || req.user._id)) {
        userId = req.user.id || req.user._id;
      } else if (req.userId) {
        userId = req.userId;
      } else {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.split(" ")[1];
          const decoded = jwt.decode(token);
          if (decoded) {
            userId = decoded.id || decoded._id || decoded.userId;
          }
        }
      }

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const db = mongoose.connection.db;
        const userDoc = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(userId) });
        
        if (userDoc) {
          userEmail = userDoc.email;
          userPhone = userDoc.phone || userDoc.phoneNumber;
        }
      }
    }

    if (!userEmail && !userPhone) {
      return res.status(200).json({ success: true, data: [] });
    }

    const quoteQuery = { $or: [] };
    if (userEmail) quoteQuery.$or.push({ email: userEmail });
    if (userPhone) quoteQuery.$or.push({ phoneNumber: userPhone });

    const userQuotes = await Quote.find(quoteQuery).select("_id");
    const quoteIds = userQuotes.map(q => q._id);

    const proposals = await Proposal.find({ quote: { $in: quoteIds } })
      .populate("quote", "projectTitle")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: proposals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProposalById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Proposal ID" });
    }
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
    if (!mongoose.Types.ObjectId.isValid(req.params.quoteId)) {
      return res.status(404).json({ success: false, message: "Invalid Quote ID" });
    }
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Proposal ID" });
    }
    const { status } = req.body;
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("quote", "email fullName");

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }
    
    if (status === "Accepted") {
      await Quote.findByIdAndUpdate(proposal.quote._id || proposal.quote, { status: "Completed" });
    } else if (status === "Rejected") {
      await Quote.findByIdAndUpdate(proposal.quote._id || proposal.quote, { status: "Rejected" });
    }

    if (proposal.quote && proposal.quote.email) {
      sendProposalUpdatedEmail(proposal.quote.email, proposal.quote.fullName, proposal.proposalId, proposal.status);
    }

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProposal = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Proposal ID" });
    }

    const updateData = { ...req.body };

    if (updateData.milestones && updateData.milestones.length > 0) {
      const calculatedTotal = updateData.milestones.reduce((sum, m) => sum + extractNumber(m.amount), 0);
      if (calculatedTotal > 0) {
        const currencySym = getCurrencySymbol(updateData.milestones[0].amount) || 'Rs.';
        updateData.totalCost = `${currencySym} ${calculatedTotal.toLocaleString('en-IN')}`;
      }
    }

    const proposal = await Proposal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("quote", "email fullName");

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    if (proposal.quote && proposal.quote.email) {
      sendProposalUpdatedEmail(proposal.quote.email, proposal.quote.fullName, proposal.proposalId, proposal.status);
    }

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProposal = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Proposal ID" });
    }
    const proposal = await Proposal.findByIdAndDelete(req.params.id).populate("quote", "email fullName");
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }

    if (proposal.quote && proposal.quote.email) {
      sendProposalDeletedEmail(proposal.quote.email, proposal.quote.fullName, proposal.proposalId);
    }

    res.status(200).json({ success: true, message: "Proposal deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};