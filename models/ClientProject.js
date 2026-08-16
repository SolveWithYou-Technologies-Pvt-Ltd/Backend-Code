const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  dueDate: { 
    type: String 
  },
  amount: {
    type: String
  },
  status: { 
    type: String, 
    enum: ["Pending", "In Progress", "Completed"], 
    default: "Pending" 
  },
  completedDate: { 
    type: Date 
  }
});

const clientProjectSchema = new mongoose.Schema({
  projectId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  proposal: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Proposal", 
    required: true 
  },
  quote: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Quote", 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  clientName: { 
    type: String, 
    required: true 
  },
  assignedEmployee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "AdminUser", 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"], 
    default: "Planning" 
  },
  progress: { 
    type: Number, 
    default: 0 
  },
  tasks: [taskSchema],
  links: [{
    label: String,
    url: String
  }],
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  description: { 
    type: String 
  },
  supportDuration: {
    type: String,
    enum: ["7 Days", "15 Days", "1 Month", "6 Months", "1 Year", "None"],
    default: "None"
  },
  supportStartDate: { 
    type: Date 
  },
  supportEndDate: { 
    type: Date 
  }
}, { timestamps: true });

module.exports = mongoose.model("ClientProjectlist", clientProjectSchema);