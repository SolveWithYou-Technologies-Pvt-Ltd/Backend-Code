const mongoose = require("mongoose");

const AdminUser = require("../models/AdminUser");

const {
  getOrganizationTree,
  getReportingManagerOptions,
  reassignDirectReports,
  validateReportingManager,
} = require("../services/teamHierarchyService");

const {
  applyEmployeeProfileDetails,
} = require("../services/employeeProfileService");

const {
  generateEmployeeId,
} = require("../services/employeeIdService");

const {
  populateAuditFields,
  setCreatedAudit,
  setDeletedAudit,
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

const canManageRole = (
  currentUser,
  targetRole
) => {
  if (!currentUser) {
    return false;
  }

  /*
    Admin accounts can only be managed by superadmin.

    Employee accounts are controlled by employees.*
    permissions, so superadmin, admin or employee may
    manage them after permission middleware approves
    the requested action.
  */
  if (targetRole === "admin") {
    return (
      currentUser.role ===
      "superadmin"
    );
  }

  if (targetRole === "employee") {
    return [
      "superadmin",
      "admin",
      "employee",
    ].includes(currentUser.role);
  }

  return false;
};

const ensureRoleAccess = (
  currentUser,
  targetRole,
  res
) => {
  if (
    canManageRole(
      currentUser,
      targetRole
    )
  ) {
    return true;
  }

  res.status(403).json({
    success: false,
    message:
      `You cannot manage ${targetRole} accounts`,
  });

  return false;
};

const populateManagedUser = (query) => {
  return populateAuditFields(
    query.populate(
      "reportingManager",
      "fullName email phone role isActive"
    )
  );
};

const getManagedUser = async (
  userId,
  targetRole
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      userId
    )
  ) {
    return null;
  }

  return populateManagedUser(
    AdminUser.findOne({
      _id: userId,
      role: targetRole,
    })
  );
};

const listUsers = (targetRole) => {
  return async (req, res) => {
    try {
      if (
        !ensureRoleAccess(
          req.adminUser,
          targetRole,
          res
        )
      ) {
        return;
      }

      const {
        search = "",
        status = "all",
      } = req.query;

      const requestedPage =
        Number.parseInt(
          req.query.page,
          10
        );

      const pageSize = 10;

      const safeRequestedPage =
        Number.isInteger(
          requestedPage
        ) &&
        requestedPage > 0
          ? requestedPage
          : 1;

      const query = {
        role: targetRole,
      };

      if (status === "deleted") {
        query.isDeleted = true;
      } else {
        query.isDeleted = {
          $ne: true,
        };

        if (status === "active") {
          query.isActive = true;
        }

        if (status === "inactive") {
          query.isActive = false;
        }
      }

      const cleanSearch =
        String(search).trim();

      if (cleanSearch) {
        query.$or = [
          {
            fullName: {
              $regex: cleanSearch,
              $options: "i",
            },
          },
          {
            email: {
              $regex: cleanSearch,
              $options: "i",
            },
          },
          {
            phone: {
              $regex: cleanSearch,
              $options: "i",
            },
          },
          {
            employeeCode: {
              $regex: cleanSearch,
              $options: "i",
            },
          },
        ];
      }

      const totalRecords =
        await AdminUser.countDocuments(
          query
        );

      const totalPages = Math.max(
        1,
        Math.ceil(
          totalRecords / pageSize
        )
      );

      const currentPage = Math.min(
        safeRequestedPage,
        totalPages
      );

      const skip =
        (currentPage - 1) *
        pageSize;

      const users =
        await AdminUser.find(query)
          .select(
            "profileImage employeeCode fullName email role isActive isDeleted updatedAt"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(pageSize)
          .lean();

      const firstRecord =
        totalRecords === 0
          ? 0
          : skip + 1;

      const lastRecord =
        totalRecords === 0
          ? 0
          : Math.min(
              skip + users.length,
              totalRecords
            );

      return res.status(200).json({
        success: true,
        data: {
          users,

          pagination: {
            currentPage,
            pageSize,
            totalPages,
            totalRecords,
            firstRecord,
            lastRecord,
            hasPreviousPage:
              currentPage > 1,
            hasNextPage:
              currentPage <
              totalPages,
          },
        },
      });
    } catch (error) {
      console.error(
        `List ${targetRole}s error:`,
        error
      );

      return res.status(500).json({
        success: false,
        message:
          `Unable to load ${targetRole}s`,
      });
    }
  };
};

const getUser = (targetRole) => {
  return async (req, res) => {
    try {
      if (
        !ensureRoleAccess(
          req.adminUser,
          targetRole,
          res
        )
      ) {
        return;
      }

      const user = await getManagedUser(
        req.params.id,
        targetRole
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            `${targetRole} account was not found`,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error(
        `Get ${targetRole} error:`,
        error
      );

      return res.status(500).json({
        success: false,
        message:
          `Unable to load ${targetRole}`,
      });
    }
  };
};

const getTeamTree = async (
  req,
  res
) => {
  try {
    const teamData =
      await getOrganizationTree();

    return res.status(200).json({
      success: true,
      data: teamData,
    });
  } catch (error) {
    console.error(
      "Get team tree error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load team structure",
    });
  }
};

const listReportingManagers = async (
  req,
  res
) => {
  try {
    const managers =
      await getReportingManagerOptions(
        req.query.excludeUserId || null
      );

    return res.status(200).json({
      success: true,
      data: {
        managers,
      },
    });
  } catch (error) {
    console.error(
      "List reporting managers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load reporting managers",
    });
  }
};

const createUser = (targetRole) => {
  return async (req, res) => {
    try {
      if (
        !ensureRoleAccess(
          req.adminUser,
          targetRole,
          res
        )
      ) {
        return;
      }

      const {
        fullName,
        email,
        phone,
        password,
        permissions,
        reportingManager,
      } = req.body || {};

      if (
        !fullName?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !password ||
        !reportingManager
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email, phone, password and reporting manager are required",
        });
      }

      if (
        String(password).length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters",
        });
      }

      const managerCheck =
        await validateReportingManager({
          reportingManagerId:
            reportingManager,
        });

      if (!managerCheck.isValid) {
        return res.status(400).json({
          success: false,
          message:
            managerCheck.message,
        });
      }

      const normalizedEmail =
        normalizeEmail(email);

      const emailExists =
        await AdminUser.exists({
          email: normalizedEmail,
        });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message:
            "This email address is already registered",
        });
      }

      const employeeCode =
        await generateEmployeeId();

      const safePermissions =
        AdminUser.sanitizeAssignedPermissions(
          permissions,
          req.adminUser,
          targetRole
        );

      /*
        Registration intentionally stores only account
        information. Remaining profile fields stay empty
        until the user edits their own profile.
      */
      const user = new AdminUser({
        fullName:
          fullName.trim(),

        email:
          normalizedEmail,

        phone:
          normalizePhone(phone),

        password,

        employeeCode,

        role:
          targetRole,

        permissions:
          safePermissions,

        reportingManager:
          managerCheck.manager._id,

        isActive:
          true,

        isDeleted:
          false,
      });

      setCreatedAudit(
        user,
        req.adminUser._id
      );

      await user.save();

      const populatedUser =
        await getManagedUser(
          user._id,
          targetRole
        );

      return res.status(201).json({
        success: true,
        message:
          `${targetRole} created successfully`,

        data: {
          user:
            populatedUser,

          employeeCode,
        },
      });
    } catch (error) {
      console.error(
        `Create ${targetRole} error:`,
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Email or employee ID already exists",
        });
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          success: false,
          message:
            firstError?.message ||
            "Invalid account details",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          `Unable to create ${targetRole}`,
      });
    }
  };
};

const editUser = (targetRole) => {
  return async (req, res) => {
    try {
      if (
        !ensureRoleAccess(
          req.adminUser,
          targetRole,
          res
        )
      ) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid account id",
        });
      }

      const user =
        await AdminUser.findOne({
          _id: req.params.id,
          role: targetRole,
          isDeleted: {
            $ne: true,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            `${targetRole} account was not found`,
        });
      }

      const payload =
        req.body || {};

      let activityAction =
        "details_updated";

      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "fullName"
        )
      ) {
        const fullName =
          String(
            payload.fullName || ""
          ).trim();

        if (fullName.length < 2) {
          return res.status(400).json({
            success: false,
            message:
              "Full name must contain at least 2 characters",
          });
        }

        user.fullName = fullName;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "email"
        )
      ) {
        const email =
          normalizeEmail(
            payload.email
          );

        if (!email) {
          return res.status(400).json({
            success: false,
            message:
              "Email address is required",
          });
        }

        if (email !== user.email) {
          const emailExists =
            await AdminUser.exists({
              email,
              _id: {
                $ne: user._id,
              },
            });

          if (emailExists) {
            return res.status(409).json({
              success: false,
              message:
                "This email address is already registered",
            });
          }
        }

        user.email = email;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "phone"
        )
      ) {
        user.phone =
          normalizePhone(
            payload.phone
          );
      }

      applyEmployeeProfileDetails(
        user,
        payload,
        {
          partial: true,
        }
      );

      /*
        Nested subdocuments are marked manually so older
        Mongoose versions also persist every change.
      */
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "address"
        )
      ) {
        user.markModified("address");
      }

      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "emergencyContact"
        )
      ) {
        user.markModified(
          "emergencyContact"
        );
      }

      if (payload.password) {
        if (
          String(
            payload.password
          ).length < 6
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Password must contain at least 6 characters",
          });
        }

        user.password =
          String(payload.password);
      }

      /*
        Profile details and permissions are updated from
        the same Edit page.

        Backend sanitization ensures the current account
        cannot assign permissions that it does not have.
      */
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "permissions"
        )
      ) {
        user.permissions =
          AdminUser.sanitizeAssignedPermissions(
            payload.permissions,
            req.adminUser,
            targetRole
          );

        user.markModified(
          "permissions"
        );

        activityAction =
          "permissions_updated";
      }

      const reportingManagerProvided =
        Object.prototype.hasOwnProperty.call(
          payload,
          "reportingManager"
        );

      const requestedManagerId =
        String(
          payload.reportingManager ||
          ""
        ).trim();

      const currentManagerId =
        String(
          user.reportingManager ||
          ""
        );

      /*
        Validate the reporting manager only when the user
        actually selected a different manager.

        This keeps old accounts updateable even when their
        current manager is missing or inactive.
      */
      if (
        reportingManagerProvided &&
        requestedManagerId &&
        requestedManagerId !==
          currentManagerId
      ) {
        const managerCheck =
          await validateReportingManager({
            reportingManagerId:
              requestedManagerId,
            userId: user._id,
          });

        if (!managerCheck.isValid) {
          return res.status(400).json({
            success: false,
            message:
              managerCheck.message,
          });
        }

        user.reportingManager =
          managerCheck.manager._id;

        activityAction =
          "reporting_updated";
      }

      setLastActivity(
        user,
        activityAction,
        req.adminUser._id
      );

      await user.save();

      const populatedUser =
        await getManagedUser(
          user._id,
          targetRole
        );

      return res.status(200).json({
        success: true,
        message:
          `${targetRole} updated successfully`,
        data: {
          user: populatedUser,
        },
      });
    } catch (error) {
      console.error(
        `Update ${targetRole} error:`,
        error
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          success: false,
          message:
            firstError?.message ||
            "Invalid account details",
        });
      }

      if (
        error.name === "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid account information",
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Email or employee code already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          `Unable to update ${targetRole}`,
      });
    }
  };
};

const changeManagedUserRole = (
  currentRole
) => {
  return async (req, res) => {
    try {
      const {
        newRole,
      } = req.body || {};

      const allowedRoles = [
        "admin",
        "employee",
      ];

      if (
        !allowedRoles.includes(
          currentRole
        ) ||
        !allowedRoles.includes(
          newRole
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Role must be Admin or Employee",
        });
      }

      if (
        currentRole === newRole
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a different role",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user id",
        });
      }

      const user =
        await AdminUser.findOne({
          _id: req.params.id,
          role: currentRole,
          isDeleted: {
            $ne: true,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            `${currentRole} account was not found`,
        });
      }

      if (
        String(user._id) ===
        String(req.adminUser._id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot change your own role",
        });
      }

      const previousRole =
        user.role;

      /*
        Keep only permissions valid for the new role.
        Existing employee-management permissions remain.
      */
      user.permissions =
        AdminUser.sanitizeAssignedPermissions(
          user.permissions,
          req.adminUser,
          newRole
        );

      user.role = newRole;

      setLastActivity(
        user,
        "role_updated",
        req.adminUser._id
      );

      await user.save();

      const updatedUser =
        await populateManagedUser(
          AdminUser.findById(
            user._id
          )
      );

      return res.status(200).json({
        success: true,
        message:
          `Role changed from ${previousRole} to ${newRole} successfully`,

        data: {
          user:
            updatedUser,

          previousRole,

          newRole,
        },
      });
    } catch (error) {
      console.error(
        "Change user role error:",
        error
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          success: false,
          message:
            firstError?.message ||
            "Unable to change user role",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to change user role",
      });
    }
  };
};

const updateUserPermissions = (
  targetRole
) => {
  return async (req, res) => {
    try {
      if (
        !ensureRoleAccess(
          req.adminUser,
          targetRole,
          res
        )
      ) {
        return;
      }

      const user =
        await AdminUser.findOne({
          _id: req.params.id,
          role: targetRole,
          isDeleted: {
            $ne: true,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            `${targetRole} account was not found`,
        });
      }

      user.permissions =
        AdminUser.sanitizeAssignedPermissions(
          req.body.permissions,
          req.adminUser,
          targetRole
        );

      setLastActivity(
        user,
        "permissions_updated",
        req.adminUser._id
      );

      await user.save();

      const populatedUser =
        await getManagedUser(
          user._id,
          targetRole
        );

      return res.status(200).json({
        success: true,
        message:
          "Permissions updated successfully",
        data: {
          user: populatedUser,
        },
      });
    } catch (error) {
      console.error(
        `Update ${targetRole} permissions error:`,
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update permissions",
      });
    }
  };
};

const updateUserStatus = (
  targetRole
) => {
  return async (req, res) => {
    try {
      if (
        !ensureRoleAccess(
          req.adminUser,
          targetRole,
          res
        )
      ) {
        return;
      }

      if (
        typeof req.body.isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false",
        });
      }

      const user =
        await AdminUser.findOne({
          _id: req.params.id,
          role: targetRole,
          isDeleted: {
            $ne: true,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            `${targetRole} account was not found`,
        });
      }

      let reassignment = null;

      if (!req.body.isActive) {
        reassignment =
          await reassignDirectReports({
          managerUser: user,
          updatedBy:
            req.adminUser._id,
        });
      }

      user.isActive =
        req.body.isActive;

      setLastActivity(
        user,
        user.isActive
          ? "activated"
          : "deactivated",
        req.adminUser._id
      );

      await user.save();

      const populatedUser =
        await getManagedUser(
          user._id,
          targetRole
        );

      return res.status(200).json({
        success: true,
        message:
          user.isActive
            ? "Account activated successfully"
            : "Account deactivated successfully",
        data: {
          user: populatedUser,
          reassignment,
        },
      });
    } catch (error) {
      console.error(
        `Update ${targetRole} status error:`,
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update account status",
      });
    }
  };
};

const deleteUser = (targetRole) => {
  return async (req, res) => {
    try {
      if (
        !ensureRoleAccess(
          req.adminUser,
          targetRole,
          res
        )
      ) {
        return;
      }

      const user =
        await AdminUser.findOne({
          _id: req.params.id,
          role: targetRole,
          isDeleted: {
            $ne: true,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            `${targetRole} account was not found`,
        });
      }

      if (
        String(user._id) ===
        String(req.adminUser._id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own account",
        });
      }

      const reassignment =
        await reassignDirectReports({
          managerUser: user,
          updatedBy:
            req.adminUser._id,
        });

      user.isActive = false;
      user.reportingManager = null;

      setDeletedAudit(
        user,
        req.adminUser._id
      );

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          `${targetRole} deleted successfully`,
        data: {
          reassignment,
        },
      });
    } catch (error) {
      console.error(
        `Delete ${targetRole} error:`,
        error
      );

      return res.status(500).json({
        success: false,
        message:
          `Unable to delete ${targetRole}`,
      });
    }
  };
};

module.exports = {
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
};
