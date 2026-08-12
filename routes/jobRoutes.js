const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  getAllJobs,
  getActiveJobs,
  createJob,
  updateJob,
  toggleJobStatus,
  deleteJob,
} = require("../controllers/jobController");

router.get("/public", getActiveJobs);

router.use(verifyToken);

router.route("/").get(getAllJobs).post(createJob);
router.route("/:id").put(updateJob).delete(deleteJob);
router.route("/:id/status").patch(toggleJobStatus);

module.exports = router;