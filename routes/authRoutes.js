const express = require("express");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  getAdminClients,
  getAdminClientById,
  createAdminClient,
  updateAdminClient,
  changeAdminClientStatus,
  deleteAdminClient,
} = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");
const uploadProfilePhoto = require("../middleware/profilePhotoUpload");
const { requirePermission, requireAnyPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get("/admin/users", verifyToken, requirePermission("clients", "view"), getAdminClients);
router.post("/admin/users", verifyToken, requirePermission("clients", "create"), createAdminClient);
router.get(
  "/admin/users/:id",
  verifyToken,
  requireAnyPermission([
    { moduleName: "clients", action: "view" },
    { moduleName: "clients", action: "edit" },
  ]),
  getAdminClientById
);
router.patch(
  "/admin/users/:id/status",
  verifyToken,
  requirePermission("clients", "edit"),
  changeAdminClientStatus
);
router.patch(
  "/admin/users/:id",
  verifyToken,
  requirePermission("clients", "edit"),
  updateAdminClient
);
router.delete(
  "/admin/users/:id",
  verifyToken,
  requirePermission("clients", "delete"),
  deleteAdminClient
);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", verifyToken, getCurrentUser);
router.put("/profile", verifyToken, uploadProfilePhoto, updateUserProfile);

module.exports = router;