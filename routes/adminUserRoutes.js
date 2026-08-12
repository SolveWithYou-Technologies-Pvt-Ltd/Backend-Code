const express = require("express");

const {
  getTeamTree,
  listUsers,
  getUser,
  listReportingManagers,
  createUser,
  editUser,
  changeManagedUserRole,
  updateUserPermissions,
  updateUserStatus,
  deleteUser,
} = require(
  "../controllers/adminUserController"
);

const verifyAdminToken = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const { requirePermission, requireAnyPermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.use(verifyAdminToken);

router.get("/team-tree", allowRoles("superadmin", "admin", "employee"), getTeamTree);

router.get(
  "/reporting-managers",
  requireAnyPermission([
    {
      moduleName: "admins",
      action: "create",
    },
    {
      moduleName: "admins",
      action: "edit",
    },
    {
      moduleName: "employees",
      action: "create",
    },
    {
      moduleName: "employees",
      action: "edit",
    },
  ]),
  listReportingManagers
);

router.get(
  "/admins",
  allowRoles("superadmin"),
  requirePermission(
    "admins",
    "view"
  ),
  listUsers("admin")
);

router.post(
  "/admins",
  allowRoles("superadmin"),
  requirePermission(
    "admins",
    "create"
  ),
  createUser("admin")
);

router.patch(
  "/admins/:id/permissions",
  allowRoles("superadmin"),
  requirePermission(
    "admins",
    "edit"
  ),
  updateUserPermissions("admin")
);

router.patch(
  "/admins/:id/role",
  allowRoles("superadmin"),
  changeManagedUserRole("admin")
);

router.patch(
  "/admins/:id/status",
  allowRoles("superadmin"),
  requirePermission(
    "admins",
    "edit"
  ),
  updateUserStatus("admin")
);

router.get(
  "/admins/:id",
  allowRoles("superadmin"),
  requirePermission(
    "admins",
    "view"
  ),
  getUser("admin")
);

router.patch(
  "/admins/:id",
  allowRoles("superadmin"),
  requirePermission(
    "admins",
    "edit"
  ),
  editUser("admin")
);

router.delete(
  "/admins/:id",
  allowRoles("superadmin"),
  requirePermission(
    "admins",
    "delete"
  ),
  deleteUser("admin")
);


router.get(
  "/employees",
  requirePermission(
    "employees",
    "view"
  ),
  listUsers("employee")
);

router.post(
  "/employees",
  requirePermission(
    "employees",
    "create"
  ),
  createUser("employee")
);

router.patch(
  "/employees/:id/permissions",
  requirePermission(
    "employees",
    "edit"
  ),
  updateUserPermissions("employee")
);



router.patch(
  "/employees/:id/role",
  allowRoles("superadmin"),
  changeManagedUserRole("employee")
);

router.patch(
  "/employees/:id/status",
  requirePermission(
    "employees",
    "edit"
  ),
  updateUserStatus("employee")
);

router.get(
  "/employees/:id",
  requirePermission(
    "employees",
    "view"
  ),
  getUser("employee")
);

router.patch(
  "/employees/:id",
  requirePermission(
    "employees",
    "edit"
  ),
  editUser("employee")
);

router.delete(
  "/employees/:id",
  requirePermission(
    "employees",
    "delete"
  ),
  deleteUser("employee")
);

module.exports = router;
