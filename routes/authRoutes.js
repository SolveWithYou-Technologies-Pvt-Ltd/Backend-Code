const express = require("express");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");
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

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login requests from this IP Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: "rl:login:",
  }),
});

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
router.post("/login", loginLimiter, loginUser);
router.get("/me", verifyToken, getCurrentUser);
router.put("/profile", verifyToken, uploadProfilePhoto, updateUserProfile);

module.exports = router;