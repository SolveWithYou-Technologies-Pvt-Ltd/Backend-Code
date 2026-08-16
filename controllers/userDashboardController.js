const Quote = require("../models/Quote");
const ClientProject = require("../models/ClientProject");
const Proposal = require("../models/Proposal");
const Ticket = require("../models/Ticket");

exports.getUserDashboardData = async (req, res) => {
  try {
    const { email, phone } = req.query;
    
    if (!email && !phone) {
      return res.status(200).json({
        success: true,
        data: { activeProjects: 0, pendingQuotes: 0, openTickets: 0, pendingProposals: 0, recentActivity: [] }
      });
    }

    const quoteQuery = { $or: [] };
    if (email && email !== "undefined") quoteQuery.$or.push({ email });
    if (phone && phone !== "undefined") quoteQuery.$or.push({ phoneNumber: phone });

    const userQuotes = await Quote.find(quoteQuery);
    const quoteIds = userQuotes.map(q => q._id);

    const pendingQuotesCount = userQuotes.filter(q => q.status === "Pending").length;

    const userProjects = await ClientProject.find({ quote: { $in: quoteIds } });
    const projectIds = userProjects.map(p => p._id);
    const activeProjectsCount = userProjects.filter(p => p.status !== "Completed" && p.status !== "Cancelled").length;

    const userTickets = await Ticket.find({ project: { $in: projectIds } });
    const openTicketsCount = userTickets.filter(t => t.status === "Open" || t.status === "In Progress").length;

    const userProposals = await Proposal.find({ quote: { $in: quoteIds } });
    const pendingProposalsCount = userProposals.filter(p => p.status === "Pending").length;

    let activities = [];

    userQuotes.forEach(q => {
      activities.push({
        id: q._id,
        type: "Quote",
        title: "Quote Submitted",
        desc: `Quote requested for ${q.projectTitle}`,
        date: q.createdAt
      });
    });

    userProposals.forEach(p => {
      activities.push({
        id: p._id,
        type: "Proposal",
        title: p.status === "Pending" ? "Proposal Received" : `Proposal ${p.status}`,
        desc: `Proposal for ${p.title}`,
        date: p.createdAt
      });
    });

    userProjects.forEach(p => {
      activities.push({
        id: p._id,
        type: "Project",
        title: "Project Initiated",
        desc: `${p.title} has been started.`,
        date: p.createdAt
      });
    });

    userTickets.forEach(t => {
      activities.push({
        id: t._id,
        type: "Ticket",
        title: "Support Ticket Raised",
        desc: `Ticket ${t.ticketId} - ${t.subject}`,
        date: t.createdAt
      });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    activities = activities.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        activeProjects: activeProjectsCount,
        pendingQuotes: pendingQuotesCount,
        openTickets: openTicketsCount,
        pendingProposals: pendingProposalsCount,
        recentActivity: activities
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message });
  }
};