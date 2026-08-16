const ClientProject = require("../models/ClientProject");
const Proposal = require("../models/Proposal");
const AdminUser = require("../models/AdminUser");
const Quote = require("../models/Quote");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const {
  sendProjectCreatedEmail,
  sendProjectUpdatedEmail,
  sendProjectDeletedEmail,
  sendTaskStatusUpdatedEmail,
} = require("../services/emails/projectEmailSender");

const syncProjectTasks = async (project) => {
  try {
    let prop = project.proposal;
    if (!prop || !prop.milestones) {
      prop = await Proposal.findById(project.proposal);
    }
    if (!prop || !prop.milestones) return;

    let needsSave = false;
    
    if (!project.tasks || project.tasks.length === 0) {
      project.tasks = prop.milestones.map(m => ({
        name: m.phase,
        dueDate: m.status,
        amount: m.amount,
        status: "Pending"
      }));
      needsSave = true;
    } else {
      prop.milestones.forEach((m, idx) => {
        if (project.tasks[idx]) {
          if (project.tasks[idx].amount !== m.amount) {
            project.tasks[idx].amount = m.amount;
            needsSave = true;
          }
          if (project.tasks[idx].name !== m.phase) {
            project.tasks[idx].name = m.phase;
            needsSave = true;
          }
          if (project.tasks[idx].dueDate !== m.status) {
            project.tasks[idx].dueDate = m.status;
            needsSave = true;
          }
        } else {
          project.tasks.push({
            name: m.phase,
            dueDate: m.status,
            amount: m.amount,
            status: "Pending"
          });
          needsSave = true;
        }
      });
    }
    
    if (needsSave) {
      await project.save();
    }
  } catch (err) {}
};

exports.createProject = async (req, res) => {
  try {
    const { proposalId, title, clientName, assignedEmployee, status, progress, startDate, endDate, description, createdBy } = req.body;
    
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }
    
    const quote = await Quote.findById(proposal.quote);
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSlice = Date.now().toString().slice(-6);
    const generatedProjectId = `PRJ-${timestampSlice}-${randomSuffix}`;

    const tasks = proposal.milestones && proposal.milestones.length > 0 
      ? proposal.milestones.map(m => ({
          name: m.phase,
          dueDate: m.status,
          amount: m.amount,
          status: "Pending"
        }))
      : [];

    const finalCreatedBy = createdBy || "Admin";

    const newProject = new ClientProject({
      projectId: generatedProjectId,
      proposal: proposalId,
      quote: proposal.quote,
      title,
      clientName,
      assignedEmployee,
      status: status || "Planning",
      progress: progress || 0,
      tasks,
      startDate,
      endDate,
      description,
      createdBy: finalCreatedBy
    });

    await newProject.save();

    if (quote && quote.email) {
      sendProjectCreatedEmail(quote.email, quote.fullName, generatedProjectId, title, finalCreatedBy);
    }

    res.status(201).json({ success: true, data: newProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await ClientProject.find()
      .populate("proposal")
      .populate("assignedEmployee", "fullName employeeCode department designation")
      .sort({ createdAt: -1 });

    for (let project of projects) {
      await syncProjectTasks(project);
    }

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserProjects = async (req, res) => {
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

    const projects = await ClientProject.find({ quote: { $in: quoteIds } })
      .populate("proposal")
      .populate("assignedEmployee", "fullName employeeCode department designation")
      .sort({ createdAt: -1 });

    for (let project of projects) {
      await syncProjectTasks(project);
    }

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await ClientProject.findById(req.params.id)
      .populate("proposal")
      .populate("assignedEmployee", "fullName employeeCode department designation");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await syncProjectTasks(project);

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectByQuoteId = async (req, res) => {
  try {
    const project = await ClientProject.findOne({ quote: req.params.quoteId })
      .populate("proposal")
      .populate("assignedEmployee", "fullName employeeCode department designation");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await syncProjectTasks(project);

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await ClientProject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const quote = await Quote.findById(project.quote);
    if (quote && quote.email) {
      sendProjectUpdatedEmail(quote.email, quote.fullName, project.projectId, project.status);
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    let status = req.body.status;

    if (status && typeof status === 'object' && status.status) {
      status = status.status;
    }

    if (!status && typeof req.body === 'string') {
      status = req.body;
    }

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const project = await ClientProject.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    task.status = status;
    if (status === "Completed") {
      task.completedDate = new Date();
    } else {
      task.completedDate = null;
    }

    if (project.tasks.length > 0) {
      const completedCount = project.tasks.filter(t => t.status === "Completed").length;
      project.progress = Math.round((completedCount / project.tasks.length) * 100);
    }

    if (project.progress === 100) {
      project.status = "Completed";
    } else if (project.progress > 0 && project.status === "Planning") {
      project.status = "In Progress";
    } else if (project.progress < 100 && project.status === "Completed") {
      project.status = "In Progress";
    }

    await project.save();
    
    const updatedProject = await ClientProject.findById(id)
      .populate("proposal")
      .populate("assignedEmployee", "fullName employeeCode department designation");
    
    const quote = await Quote.findById(updatedProject.quote);
    if (quote && quote.email) {
      sendTaskStatusUpdatedEmail(quote.email, quote.fullName, updatedProject.projectId, task.name, task.status);
    }

    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await ClientProject.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const quote = await Quote.findById(project.quote);
    if (quote && quote.email) {
      sendProjectDeletedEmail(quote.email, quote.fullName, project.projectId);
    }

    res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeesForAssignment = async (req, res) => {
  try {
    const employees = await AdminUser.find({ role: { $in: ["employee", "admin"] }, isActive: true, isDeleted: false })
      .select("fullName employeeCode department designation");
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};