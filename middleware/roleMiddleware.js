const AdminUser = require("../models/AdminUser");

const loadRequestAdmin = async (req) => {
  if (req.adminUser) {
    return req.adminUser;
  }

  if (!req.userId) {
    return null;
  }

  const adminUser = await AdminUser.findOne({
    _id: req.userId, 
    isDeleted: { $ne: true },
  }).select("-password");

  if (adminUser) {
    adminUser.permissions =
      AdminUser.cleanPermissions(
        adminUser.permissions
      );

    req.adminUser = adminUser;
  }

  return adminUser;
};

const allowRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const adminUser =
        await loadRequestAdmin(req);

      if (!adminUser) {
        return res.status(401).json({
          success: false,
          message:
            "Admin account was not found",
        });
      }

      if (!adminUser.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is inactive",
        });
      }

      if (
        !allowedRoles.includes(
          adminUser.role
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your role cannot perform this action",
        });
      }

      next();
    } catch (error) {
      console.error(
        "Role middleware error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify admin role",
      });
    }
  };
};

module.exports = allowRoles;
module.exports.loadRequestAdmin = loadRequestAdmin;
