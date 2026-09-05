const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getUniqueAppliedRoles
} = require("../controllers/jobApplicationController");

router.post("/", submitApplication);

router.use(verifyToken);
router.route("/roles").get(getUniqueAppliedRoles);
router.route("/").get(getAllApplications);
router.route("/:id").get(getApplicationById).delete(deleteApplication);
router.route("/:id/status").patch(updateApplicationStatus);

module.exports = router;