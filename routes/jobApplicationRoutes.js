const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication
} = require("../controllers/jobApplicationController");

router.post("/", submitApplication);

router.use(verifyToken);
router.route("/").get(getAllApplications);
router.route("/:id").get(getApplicationById).delete(deleteApplication);
router.route("/:id/status").patch(updateApplicationStatus);

module.exports = router;