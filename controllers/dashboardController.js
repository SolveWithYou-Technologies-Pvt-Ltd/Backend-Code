const User = require("../models/userModel");
const AdminUser = require("../models/AdminUser");
const ClientProjectlist = require("../models/ClientProject");
const Quote = require("../models/Quote");
const Proposal = require("../models/Proposal");
const Ticket = require("../models/Ticket");
const Job = require("../models/jobModel");
const JobApplication = require("../models/jobApplicationModel");
const Service = require("../models/serviceModel");

const getDashboardStats = async (req, res) => {
  try {
    const { filter } = req.query;
    let dateQuery = {};
    const now = new Date();

    if (filter === "daily") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));
      dateQuery = { createdAt: { $gte: start, $lte: end } };
    } else if (filter === "weekly") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      dateQuery = { createdAt: { $gte: start, $lte: end } };
    } else if (filter === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      dateQuery = { createdAt: { $gte: start, $lte: end } };
    }

    const users = await User.countDocuments(dateQuery);
    const admins = await AdminUser.countDocuments(dateQuery);
    const projects = await ClientProjectlist.countDocuments(dateQuery);
    const quotes = await Quote.countDocuments(dateQuery);
    const proposals = await Proposal.countDocuments(dateQuery);
    const tickets = await Ticket.countDocuments(dateQuery);
    const jobs = await Job.countDocuments(dateQuery);
    const applications = await JobApplication.countDocuments(dateQuery);
    const services = await Service.countDocuments(dateQuery);

    const recentProjects = await ClientProjectlist.find(dateQuery).select("createdAt").lean();
    const recentUsers = await User.find(dateQuery).select("createdAt").lean();
    const recentQuotes = await Quote.find(dateQuery).select("createdAt").lean();
    const recentProposals = await Proposal.find(dateQuery).select("createdAt").lean();
    const recentTickets = await Ticket.find(dateQuery).select("createdAt").lean();

    const chartDataMap = {};

    const processChartData = (dataArray, key) => {
      dataArray.forEach((item) => {
        const dateStr = item.createdAt.toISOString().split("T")[0];
        if (!chartDataMap[dateStr]) {
          chartDataMap[dateStr] = { date: dateStr, projects: 0, users: 0, quotes: 0, proposals: 0, tickets: 0 };
        }
        chartDataMap[dateStr][key] += 1;
      });
    };

    processChartData(recentProjects, "projects");
    processChartData(recentUsers, "users");
    processChartData(recentQuotes, "quotes");
    processChartData(recentProposals, "proposals");
    processChartData(recentTickets, "tickets");

    const chartData = Object.values(chartDataMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.status(200).json({
      summary: { users, admins, projects, quotes, proposals, tickets, jobs, applications, services },
      chartData,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardStats };