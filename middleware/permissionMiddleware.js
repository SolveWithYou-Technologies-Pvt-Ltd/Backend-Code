const AdminUser = require("../models/AdminUser");

const { loadRequestAdmin } = require("./roleMiddleware");

const userHasPermission = ( adminUser, moduleName, action) => {
  return AdminUser.hasPermission( adminUser, moduleName, action );
};

const requirePermission = ( moduleName, action ) => {
  return async (req, res, next) => {
    try {
      const adminUser = await loadRequestAdmin(req);
      if (!adminUser) {
        return res.status(401).json({
          success: false,
          message: "Admin login is required",
        });
      }
      if (!adminUser.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is inactive",
        });
      }

      if (
        !userHasPermission(
          adminUser,
          moduleName,
          action
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            `${moduleName}.${action} permission is required`,
        });
      }

      next();
    } catch (error) {
      console.error(
        "Permission middleware error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify admin permission",
      });
    }
  };
};

const requireAnyPermission = ( permissionList = [] ) => {
  return async (req, res, next) => {
    try {
      const adminUser =await loadRequestAdmin(req);
      if (!adminUser) {
        return res.status(401).json({
          success: false,
          message: "Admin login is required",
        });
      }
      if (!adminUser.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is inactive",
        });
      }
      const permissionFound =
        permissionList.some(
          ({ moduleName, action }) =>
            userHasPermission(
              adminUser,
              moduleName,
              action
            )
        );

      if (!permissionFound) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission for this action",
        });
      }

      next();
    } catch (error) {
      console.error(
        "Permission middleware error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify admin permission",
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  userHasPermission,
};
