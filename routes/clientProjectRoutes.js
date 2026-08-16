const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { 
  createProject, 
  getAllProjects, 
  getUserProjects, 
  getProjectById, 
  getProjectByQuoteId,
  updateProject, 
  deleteProject, 
  getEmployeesForAssignment,
  updateTaskStatus
} = require("../controllers/clientProjectController");

router.get("/user/me", getUserProjects);
router.get("/quote/:quoteId", getProjectByQuoteId);

router.use(verifyToken);

router.get("/employees", getEmployeesForAssignment);
router.get("/", getAllProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.patch("/:id/task/:taskId", updateTaskStatus);

module.exports = router;