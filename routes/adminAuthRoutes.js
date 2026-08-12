const express = require("express");

const {
  registerSuperAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
} = require(
  "../controllers/adminAuthController"
);

const {
  updateAdminProfilePicture,
} = require(
  "../controllers/adminProfilePictureController"
);

const verifyAdminToken = require(
  "../middleware/authMiddleware"
);

const {
  uploadAdminProfilePicture,
} = require(
  "../middleware/adminProfilePictureUpload"
);

const router = express.Router();

router.post(
  "/register-superadmin",
  registerSuperAdmin
);

router.post(
  "/login",
  loginAdmin
);

router.get(
  "/profile",
  verifyAdminToken,
  getAdminProfile
);

router.patch(
  "/profile",
  verifyAdminToken,
  updateAdminProfile
);

router.patch(
  "/profile-picture",
  verifyAdminToken,
  uploadAdminProfilePicture,
  updateAdminProfilePicture
);

module.exports = router;
