const express = require(
  "express"
);

const {
  getAdminServices,
  getAdminService,
  createAdminService,
  updateAdminService,
  changeAdminServiceStatus,
  deleteAdminService,
} = require(
  "../controllers/adminServiceController"
);

const verifyAdminToken = require(
  "../middleware/authMiddleware"
);

const {
  requirePermission,
  requireAnyPermission,
} = require(
  "../middleware/permissionMiddleware"
);

const router =
  express.Router();

router.use(
  verifyAdminToken
);

router.get(
  "/",
  requirePermission(
    "services",
    "view"
  ),
  getAdminServices
);

router.post(
  "/",
  requirePermission(
    "services",
    "create"
  ),
  createAdminService
);

router.get(
  "/:id",
  requireAnyPermission([
    {
      moduleName: "services",
      action: "view",
    },
    {
      moduleName: "services",
      action: "edit",
    },
  ]),
  getAdminService
);

router.patch(
  "/:id/status",
  requirePermission(
    "services",
    "edit"
  ),
  changeAdminServiceStatus
);

router.patch(
  "/:id",
  requirePermission(
    "services",
    "edit"
  ),
  updateAdminService
);

router.delete(
  "/:id",
  requirePermission(
    "services",
    "delete"
  ),
  deleteAdminService
);

module.exports = router;
