const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  getAllServices,
  getActiveServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService
} = require("../controllers/serviceController");

router.get("/public", getActiveServices);

router.use(verifyToken);
router.route("/").get(getAllServices).post(createService);
router.route("/:id").get(getServiceById).put(updateService).delete(deleteService);
router.route("/:id/status").patch(toggleServiceStatus);

module.exports = router;