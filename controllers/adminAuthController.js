const AdminUser = require("../models/AdminUser");
const generatetoken = require("../utils/generateToken");
const {
  applyEmployeeProfileDetails,
} = require("../services/employeeProfileService");

const {
  populateAuditFields,
  setCreatedAudit,
  setLastActivity,
} = require("../services/userAuditService");

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const normalizePhone = (phone) => {
  return String(phone || "").trim();
};

const prepareProfile = (adminUser) => {
  adminUser.permissions = AdminUser.cleanPermissions(adminUser.permissions);

  return adminUser;
};

const profileQuery = () => {
  return AdminUser.findOne({
    isDeleted: {
      $ne: true,
    },
  });
};

const registerSuperAdmin = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body || {};

    if (!fullName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const existingSuperAdmin = await AdminUser.exists({
      role: "superadmin",
      isDeleted: {
        $ne: true,
      },
    });

    if (existingSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Superadmin registration is already completed",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const emailExists = await AdminUser.exists({
      email: normalizedEmail,
    });

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered",
      });
    }

    const superAdmin = new AdminUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizePhone(phone),
      password,
      role: "superadmin",
      permissions: {},
      isActive: true,
      isDeleted: false,
    });

    applyEmployeeProfileDetails(superAdmin, req.body, {
      partial: false,
    });

    setCreatedAudit(superAdmin, superAdmin._id);

    await superAdmin.save();

    const token = generatetoken(superAdmin._id);

    return res.status(201).json({
      success: true,
      message: "Superadmin registered successfully",
      data: {
        token,
      },
    });
  } catch (error) {
    console.error("Register superadmin error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Superadmin or email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];

      return res.status(400).json({
        success: false,
        message: firstError?.message || "Invalid registration details",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register superadmin",
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const adminUser = await AdminUser.findOne({
      email: normalizeEmail(email),
      isDeleted: {
        $ne: true,
      },
    }).select("+password");

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
      });
    }

    const passwordMatches = await adminUser.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
      });
    }

    if (!adminUser.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const token = generatetoken(adminUser._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const adminUser = await populateAuditFields(
      AdminUser.findOne({
        _id: req.userId,
        isDeleted: {
          $ne: true,
        },
      })
        .select("-password")
        .populate("reportingManager", "fullName email phone role isActive"),
    );

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: "Admin account was not found",
      });
    }

    if (!adminUser.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile: prepareProfile(adminUser),
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch admin profile",
    });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const adminUser = await AdminUser.findOne({
      _id: req.userId,
      isDeleted: {
        $ne: true,
      },
    }).select("+password");

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: "Admin account was not found",
      });
    }

    if (!adminUser.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const { fullName, email, phone, currentPassword, newPassword } =
      req.body || {};

    if (fullName !== undefined) {
      const cleanFullName = String(fullName).trim();

      if (cleanFullName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Full name must contain at least 2 characters",
        });
      }

      adminUser.fullName = cleanFullName;
    }

    if (email !== undefined) {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email address is required",
        });
      }

      const emailExists = await AdminUser.exists({
        email: normalizedEmail,
        _id: {
          $ne: adminUser._id,
        },
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "This email address is already registered",
        });
      }

      adminUser.email = normalizedEmail;
    }

    if (phone !== undefined) {
      adminUser.phone = normalizePhone(phone);
    }

    applyEmployeeProfileDetails(adminUser, req.body, {
      partial: true,
    });

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required",
        });
      }

      const passwordMatches = await adminUser.comparePassword(currentPassword);

      if (!passwordMatches) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must contain at least 6 characters",
        });
      }

      adminUser.password = String(newPassword);
    }

    setLastActivity(adminUser, "profile_updated", adminUser._id);

    await adminUser.save();

    const updatedProfile = await populateAuditFields(
      AdminUser.findById(adminUser._id)
        .select("-password")
        .populate("reportingManager", "fullName email phone role isActive"),
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: prepareProfile(updatedProfile),
      },
    });
  } catch (error) {
    console.error("Update admin profile error:", error);

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];

      return res.status(400).json({
        success: false,
        message: firstError?.message || "Invalid profile details",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

module.exports = {
  registerSuperAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
};
