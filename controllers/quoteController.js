const Quote = require("../models/Quote");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const {
  sendQuoteCreatedEmail,
  sendQuoteUpdatedEmail,
  sendQuoteDeletedEmail,
} = require("../services/emails/quoteEmailSender");

exports.createQuote = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      service,
      currency,
      budget,
      timeline,
      projectTitle,
      projectDescription,
      referenceLinks,
      facilities,
      createdBy,
      creatorEmployeeId
    } = req.body;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSlice = Date.now().toString().slice(-6);
    const generatedQuoteId = `QT-${timestampSlice}-${randomSuffix}`;

    const finalCreatedBy = createdBy || "User";

    const newQuote = new Quote({
      quoteId: generatedQuoteId,
      fullName,
      email,
      phoneNumber,
      service,
      currency,
      budget,
      timeline,
      projectTitle,
      projectDescription,
      referenceLinks,
      facilities,
      createdBy: finalCreatedBy,
      creatorEmployeeId: creatorEmployeeId || ""
    });

    await newQuote.save();

    // Send email with user/admin source tracking
    sendQuoteCreatedEmail(email, fullName, generatedQuoteId, service, finalCreatedBy);

    res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      quoteId: generatedQuoteId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.getAllQuotes = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { quoteId: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } }
      ];
    }

    const quotes = await Quote.find(query)
      .populate("service", "title serviceId")
      .select("quoteId fullName email phoneNumber service status createdAt createdBy creatorEmployeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserQuotes = async (req, res) => {
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

    const query = { $or: [] };
    if (userEmail) query.$or.push({ email: userEmail });
    if (userPhone) query.$or.push({ phoneNumber: userPhone });

    const quotes = await Quote.find(query)
      .populate("service", "title serviceId description")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate("service", "title serviceId description");
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("service", "title serviceId");
    
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    sendQuoteUpdatedEmail(quote.email, quote.fullName, quote.quoteId, quote.status);

    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("service", "title serviceId");
    
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    sendQuoteUpdatedEmail(quote.email, quote.fullName, quote.quoteId, quote.status);

    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    sendQuoteDeletedEmail(quote.email, quote.fullName, quote.quoteId);

    res.status(200).json({ success: true, message: "Quote deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};