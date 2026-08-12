const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const PERMISSION_ACTIONS = [
  "create",
  "view",
  "edit",
  "delete",
];

const unsafeModuleNames = new Set([
  "__proto__",
  "prototype",
  "constructor",
]);

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const createActionPermissions = () => {
  return {
    create: false,
    view: false,
    edit: false,
    delete: false,
  };
};

const applyFlatPermission = (
  permissionObject,
  flatPermission
) => {
  if (typeof flatPermission !== "string") {
    return;
  }

  const [moduleName, rawAction] =
    flatPermission.split(".");

  if (
    !moduleName ||
    unsafeModuleNames.has(moduleName)
  ) {
    return;
  }

  if (!permissionObject[moduleName]) {
    permissionObject[moduleName] =
      createActionPermissions();
  }

  if (PERMISSION_ACTIONS.includes(rawAction)) {
    permissionObject[moduleName][rawAction] =
      true;
    return;
  }

  if (
    [
      "update",
      "status",
      "permissions",
    ].includes(rawAction)
  ) {
    permissionObject[moduleName].edit = true;
    return;
  }

  if (rawAction === "manage") {
    permissionObject[moduleName].create = true;
    permissionObject[moduleName].edit = true;
    permissionObject[moduleName].delete = true;
  }
};

const cleanPermissions = (input) => {
  const cleanPermissionObject = {};

  if (Array.isArray(input)) {
    input.forEach((permission) => {
      applyFlatPermission(
        cleanPermissionObject,
        permission
      );
    });

    return cleanPermissionObject;
  }

  if (!isPlainObject(input)) {
    return cleanPermissionObject;
  }

  Object.entries(input).forEach(
    ([moduleName, modulePermissions]) => {
      if (
        !moduleName ||
        unsafeModuleNames.has(moduleName) ||
        !isPlainObject(modulePermissions)
      ) {
        return;
      }

      const actions =
        createActionPermissions();

      PERMISSION_ACTIONS.forEach(
        (action) => {
          actions[action] =
            modulePermissions[action] ===
            true;
        }
      );

      cleanPermissionObject[moduleName] =
        actions;
    }
  );

  return cleanPermissionObject;
};

const isModuleAllowedForRole = (
  moduleName,
  targetRole
) => {
  /*
    Admin-management permissions are reserved for
    superadmin-controlled accounts.

    Employees may receive employee-management
    permissions such as view, create, edit and delete.
  */
  if (moduleName === "admins") {
    return false;
  }

  return [
    "admin",
    "employee",
  ].includes(targetRole);
};

const sanitizeAssignedPermissions = (
  requestedPermissions,
  currentUser,
  targetRole
) => {
  const requested = cleanPermissions(
    requestedPermissions
  );

  const currentPermissions =
    cleanPermissions(
      currentUser?.permissions
    );

  const sanitizedPermissions = {};

  Object.entries(requested).forEach(
    ([moduleName, modulePermissions]) => {
      if (
        !isModuleAllowedForRole(
          moduleName,
          targetRole
        )
      ) {
        return;
      }

      const actions =
        createActionPermissions();

      PERMISSION_ACTIONS.forEach(
        (action) => {
          const requestedValue =
            modulePermissions[action] ===
            true;

          const canAssign =
            currentUser?.role ===
              "superadmin" ||
            currentPermissions[moduleName]?.[
              action
            ] === true;

          actions[action] = Boolean(
            requestedValue && canAssign
          );
        }
      );

      sanitizedPermissions[moduleName] =
        actions;
    }
  );

  return sanitizedPermissions;
};

const hasPermission = (
  user,
  moduleName,
  action
) => {
  if (user?.role === "superadmin") {
    return true;
  }

  if (!PERMISSION_ACTIONS.includes(action)) {
    return false;
  }

  const permissions = cleanPermissions(
    user?.permissions
  );

  return (
    permissions[moduleName]?.[action] ===
    true
  );
};

const activitySchema =
  new mongoose.Schema(
    {
      action: {
        type: String,
        default: "created",
        trim: true,
      },

      by: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "AdminUser",
        default: null,
      },

      at: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

const addressSchema =
  new mongoose.Schema(
    {
      line1: {
        type: String,
        trim: true,
        default: "",
      },

      line2: {
        type: String,
        trim: true,
        default: "",
      },

      city: {
        type: String,
        trim: true,
        default: "",
      },

      state: {
        type: String,
        trim: true,
        default: "",
      },

      pincode: {
        type: String,
        trim: true,
        default: "",
      },

      country: {
        type: String,
        trim: true,
        default: "India",
      },
    },
    {
      _id: false,
    }
  );

const emergencyContactSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        trim: true,
        default: "",
      },

      relation: {
        type: String,
        trim: true,
        default: "",
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },
    },
    {
      _id: false,
    }
  );

const adminUserSchema =
  new mongoose.Schema(
    {
      fullName: {
        type: String,
        required: [
          true,
          "Full name is required",
        ],
        trim: true,
        minlength: [
          2,
          "Full name must contain at least 2 characters",
        ],
        maxlength: [
          60,
          "Full name cannot exceed 60 characters",
        ],
      },

      email: {
        type: String,
        required: [
          true,
          "Email address is required",
        ],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
          /^\S+@\S+\.\S+$/,
          "Please provide a valid email address",
        ],
      },

      phone: {
        type: String,
        trim: true,
        default: "",
        validate: {
          validator(value) {
            return (
              !value ||
              /^[0-9+()\-\s]{7,20}$/.test(
                value
              )
            );
          },
          message:
            "Please provide a valid phone number",
        },
      },

      profileImage: {
        type: String,
        trim: true,
        default: "",
      },

      alternatePhone: {
        type: String,
        trim: true,
        default: "",
      },

      dateOfBirth: {
        type: Date,
        default: null,
      },

      gender: {
        type: String,
        enum: [
          "",
          "male",
          "female",
          "other",
          "prefer_not_to_say",
        ],
        default: "",
      },

      bloodGroup: {
        type: String,
        enum: [
          "",
          "A+",
          "A-",
          "B+",
          "B-",
          "AB+",
          "AB-",
          "O+",
          "O-",
        ],
        default: "",
      },

      employeeCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
        immutable: true,
      },

      department: {
        type: String,
        trim: true,
        default: "",
      },

      designation: {
        type: String,
        trim: true,
        default: "",
      },

      joiningDate: {
        type: Date,
        default: null,
      },

      employmentType: {
        type: String,
        enum: [
          "",
          "full_time",
          "part_time",
          "contract",
          "intern",
          "temporary",
        ],
        default: "",
      },

      workLocation: {
        type: String,
        trim: true,
        default: "",
      },

      highestQualification: {
        type: String,
        trim: true,
        default: "",
      },

      totalExperienceYears: {
        type: Number,
        min: [
          0,
          "Experience cannot be negative",
        ],
        max: [
          60,
          "Experience cannot exceed 60 years",
        ],
        default: null,
      },

      address: {
        type: addressSchema,
        default: () => ({}),
      },

      emergencyContact: {
        type: emergencyContactSchema,
        default: () => ({}),
      },

      password: {
        type: String,
        required: [
          true,
          "Password is required",
        ],
        minlength: [
          6,
          "Password must contain at least 6 characters",
        ],
        select: false,
      },

      role: {
        type: String,
        enum: [
          "superadmin",
          "admin",
          "employee",
        ],
        required: true,
      },

      permissions: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
      },

      reportingManager: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "AdminUser",
        default: null,
        index: true,
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "AdminUser",
        default: null,
      },

      updatedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "AdminUser",
        default: null,
      },

      deletedAt: {
        type: Date,
        default: null,
      },

      lastActivity: {
        type: activitySchema,
        default: () => ({
          action: "created",
          by: null,
          at: new Date(),
        }),
      },
    },
    {
      timestamps: true,
    }
  );

adminUserSchema.index(
  {
    role: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      role: "superadmin",
    },
  }
);

adminUserSchema.index(
  {
    employeeCode: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      employeeCode: {
        $gt: "",
      },
    },
  }
);

adminUserSchema.pre(
  "validate",
  function cleanPermissionsBeforeSave() {
    this.permissions = cleanPermissions(
      this.permissions
    );
  }
);

adminUserSchema.pre(
  "save",
  async function hashPassword() {
    if (!this.isModified("password")) {
      return;
    }

    this.password = await bcrypt.hash(
      this.password,
      12
    );
  }
);

adminUserSchema.methods.comparePassword =
  function comparePassword(
    enteredPassword
  ) {
    return bcrypt.compare(
      enteredPassword,
      this.password
    );
  };

adminUserSchema.methods.toJSON =
  function removePrivateFields() {
    const user = this.toObject();

    delete user.password;

    user.permissions = cleanPermissions(
      user.permissions
    );

    return user;
  };

adminUserSchema.statics.cleanPermissions =
  cleanPermissions;

adminUserSchema.statics.sanitizeAssignedPermissions =
  sanitizeAssignedPermissions;

adminUserSchema.statics.hasPermission =
  hasPermission;

module.exports = mongoose.model(
  "AdminUser",
  adminUserSchema
);
