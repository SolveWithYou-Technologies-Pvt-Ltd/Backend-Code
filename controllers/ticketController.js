const Ticket = require("../models/Ticket");
const mongoose = require("mongoose");
const ClientProject = mongoose.models.ClientProjectlist || mongoose.model("ClientProjectlist", new mongoose.Schema({})); 
const Quote = require("../models/Quote");
const {
  sendTicketCreatedEmail,
  sendTicketUpdatedEmail,
  sendTicketDeletedEmail,
} = require("../services/emails/ticketEmailSender");

const getTicketUserContact = async (projectRef) => {
  try {
    const project = await ClientProject.findById(projectRef).populate("quote");
    if (project && project.quote) {
      const quoteDoc = typeof project.quote === "object" ? project.quote : await Quote.findById(project.quote);
      if (quoteDoc) {
        return {
          email: quoteDoc.email,
          fullName: quoteDoc.fullName || "Valued Client"
        };
      }
    }
  } catch (e) {}
  return null;
};

exports.createTicket = async (req, res) => {
  try {
    const { projectId, subject, description, priority, createdBy } = req.body;
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TKT-${Date.now().toString().slice(-4)}-${randomSuffix}`;
    
    const finalCreatedBy = createdBy || "User";

    const newTicket = new Ticket({
      ticketId,
      project: projectId,
      subject,
      description,
      priority,
      createdBy: finalCreatedBy
    });
    
    await newTicket.save();

    const userInfo = await getTicketUserContact(projectId);
    if (userInfo && userInfo.email) {
      sendTicketCreatedEmail(userInfo.email, userInfo.fullName, ticketId, subject, finalCreatedBy);
    }

    res.status(201).json({ success: true, data: newTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserTickets = async (req, res) => {
  try {
    let userEmail = req.query.email && req.query.email !== "undefined" ? req.query.email : null;
    let userPhone = req.query.phone && req.query.phone !== "undefined" ? req.query.phone : null;

    if (!userEmail && !userPhone) {
      return res.status(200).json({ success: true, data: [] });
    }

    const quoteQuery = { $or: [] };
    if (userEmail) quoteQuery.$or.push({ email: userEmail });
    if (userPhone) quoteQuery.$or.push({ phoneNumber: userPhone });

    const userQuotes = await Quote.find(quoteQuery).select("_id");
    const quoteIds = userQuotes.map(q => q._id);

    const projects = await ClientProject.find({ quote: { $in: quoteIds } }).select("_id");
    const projectIds = projects.map(p => p._id);

    const tickets = await Ticket.find({ project: { $in: projectIds } })
      .populate("project", "title projectId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("project", "title projectId clientName")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Ticket ID" });
    }
    const ticket = await Ticket.findById(req.params.id).populate("project", "title projectId clientName");
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Ticket ID" });
    }
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const userInfo = await getTicketUserContact(ticket.project);
    if (userInfo && userInfo.email) {
      sendTicketUpdatedEmail(userInfo.email, userInfo.fullName, ticket.ticketId, ticket.status);
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Ticket ID" });
    }
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const userInfo = await getTicketUserContact(ticket.project);
    if (userInfo && userInfo.email) {
      sendTicketUpdatedEmail(userInfo.email, userInfo.fullName, ticket.ticketId, ticket.status);
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Ticket ID" });
    }
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const userInfo = await getTicketUserContact(ticket.project);
    if (userInfo && userInfo.email) {
      sendTicketDeletedEmail(userInfo.email, userInfo.fullName, ticket.ticketId);
    }

    res.status(200).json({ success: true, message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};