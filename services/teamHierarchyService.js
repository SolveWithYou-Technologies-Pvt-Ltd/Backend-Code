const mongoose = require("mongoose");

const AdminUser = require("../models/AdminUser");

const {
  auditPopulateOptions,
} = require("./userAuditService");

const TEAM_ROLES = [
  "superadmin",
  "admin",
  "employee",
];

const rolePriority = {
  superadmin: 1,
  admin: 2,
  employee: 3,
};

const getId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
};

const toPlainObject = (user) => {
  if (!user) {
    return null;
  }

  if (typeof user.toObject === "function") {
    return user.toObject();
  }

  return {
    ...user,
  };
};

const formatRole = (role) => {
  if (!role) {
    return "User";
  }

  return `${role
    .charAt(0)
    .toUpperCase()}${role.slice(1)}`;
};

const createTeamMember = (user) => {
  const plainUser = toPlainObject(user);

  return {
    _id: String(plainUser._id),
    fullName: plainUser.fullName,
    email: plainUser.email,
    phone: plainUser.phone || "",
    profileImage:
      plainUser.profileImage || "",
    designation:
      plainUser.designation || "",
    department:
      plainUser.department || "",
    role: plainUser.role,
    isActive: plainUser.isActive,
    isDeleted: plainUser.isDeleted === true,
    createdAt: plainUser.createdAt,
    updatedAt: plainUser.updatedAt,
    createdBy: plainUser.createdBy || null,
    updatedBy: plainUser.updatedBy || null,
    deletedAt: plainUser.deletedAt || null,
    lastActivity:
      plainUser.lastActivity || null,
    label: `${plainUser.fullName} (${formatRole(
      plainUser.role
    )})${
      plainUser.phone
        ? ` - ${plainUser.phone}`
        : ""
    }`,
  };
};

const loadOrganizationUsers = async () => {
  return AdminUser.find({
    role: {
      $in: TEAM_ROLES,
    },
    isDeleted: {
      $ne: true,
    },
  })
    .select(
      [
        "fullName",
        "email",
        "phone",
        "profileImage",
        "designation",
        "department",
        "role",
        "isActive",
        "isDeleted",
        "reportingManager",
        "createdBy",
        "updatedBy",
        "deletedAt",
        "lastActivity",
        "createdAt",
        "updatedAt",
      ].join(" ")
    )
    .populate(auditPopulateOptions)
    .lean();
};

const createUserMap = (users) => {
  return new Map(
    users.map((user) => [
      String(user._id),
      user,
    ])
  );
};

const buildHierarchyPath = (
  user,
  userMap
) => {
  const path = [];
  const visited = new Set();

  let currentUser = user;

  while (currentUser) {
    const currentId = String(currentUser._id);

    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);
    path.unshift(createTeamMember(currentUser));

    const managerId = getId(
      currentUser.reportingManager
    );

    currentUser = managerId
      ? userMap.get(managerId)
      : null;
  }

  return path;
};

const decorateUser = (
  user,
  userMap
) => {
  const plainUser = toPlainObject(user);
  const managerId = getId(
    plainUser.reportingManager
  );

  const reportingManager = managerId
    ? userMap.get(managerId)
    : null;

  const teamHierarchy = buildHierarchyPath(
    plainUser,
    userMap
  );

  return {
    ...plainUser,
    reportingManager: reportingManager
      ? createTeamMember(reportingManager)
      : null,
    teamHierarchy,
    teamHierarchyText: teamHierarchy
      .map((member) => member.label)
      .join(" → "),
  };
};

const decorateUsersWithHierarchy = async (
  users
) => {
  const organizationUsers =
    await loadOrganizationUsers();

  const userMap = createUserMap(
    organizationUsers
  );

  return users.map((user) =>
    decorateUser(user, userMap)
  );
};

const getDescendantIds = (
  userId,
  users
) => {
  const descendants = new Set();
  const queue = [String(userId)];

  while (queue.length > 0) {
    const managerId = queue.shift();

    users.forEach((user) => {
      const currentUserId = String(user._id);
      const currentManagerId = getId(
        user.reportingManager
      );

      if (
        currentManagerId === managerId &&
        !descendants.has(currentUserId)
      ) {
        descendants.add(currentUserId);
        queue.push(currentUserId);
      }
    });
  }

  return descendants;
};

const getReportingManagerOptions = async (
  excludeUserId = null
) => {
  const users = await loadOrganizationUsers();
  const userMap = createUserMap(users);

  const excludedIds = new Set();

  if (excludeUserId) {
    excludedIds.add(String(excludeUserId));

    getDescendantIds(
      excludeUserId,
      users
    ).forEach((id) => excludedIds.add(id));
  }

  return users
    .filter(
      (user) =>
        user.isActive &&
        !excludedIds.has(String(user._id))
    )
    .sort((first, second) => {
      const roleDifference =
        rolePriority[first.role] -
        rolePriority[second.role];

      if (roleDifference !== 0) {
        return roleDifference;
      }

      return first.fullName.localeCompare(
        second.fullName
      );
    })
    .map((user) => {
      const hierarchy = buildHierarchyPath(
        user,
        userMap
      );

      return {
        ...createTeamMember(user),
        teamHierarchy: hierarchy,
        teamHierarchyText: hierarchy
          .map((member) => member.label)
          .join(" → "),
      };
    });
};

const validateReportingManager = async ({
  reportingManagerId,
  userId = null,
}) => {
  if (
    !reportingManagerId ||
    !mongoose.Types.ObjectId.isValid(
      reportingManagerId
    )
  ) {
    return {
      isValid: false,
      message:
        "Please select a valid reporting manager",
    };
  }

  const manager = await AdminUser.findOne({
    _id: reportingManagerId,
    role: {
      $in: TEAM_ROLES,
    },
    isActive: true,
    isDeleted: {
      $ne: true,
    },
  }).select(
    "fullName email phone role isActive reportingManager"
  );

  if (!manager) {
    return {
      isValid: false,
      message:
        "Selected reporting manager is not active",
    };
  }

  if (!userId) {
    return {
      isValid: true,
      manager,
    };
  }

  if (
    String(manager._id) === String(userId)
  ) {
    return {
      isValid: false,
      message:
        "A user cannot report to their own account",
    };
  }

  const users = await loadOrganizationUsers();
  const descendantIds = getDescendantIds(
    userId,
    users
  );

  if (
    descendantIds.has(String(manager._id))
  ) {
    return {
      isValid: false,
      message:
        "A team member below this user cannot become their reporting manager",
    };
  }

  return {
    isValid: true,
    manager,
  };
};

const findNearestActiveManager = async ({
  startingManagerId,
  excludedUserId,
}) => {
  const users = await loadOrganizationUsers();
  const userMap = createUserMap(users);
  const visited = new Set();

  let currentManagerId = getId(
    startingManagerId
  );

  while (currentManagerId) {
    if (visited.has(currentManagerId)) {
      break;
    }

    visited.add(currentManagerId);

    const manager = userMap.get(
      currentManagerId
    );

    if (!manager) {
      break;
    }

    if (
      manager.isActive &&
      String(manager._id) !==
        String(excludedUserId)
    ) {
      return manager;
    }

    currentManagerId = getId(
      manager.reportingManager
    );
  }

  return (
    users.find(
      (user) =>
        user.role === "superadmin" &&
        user.isActive &&
        String(user._id) !==
          String(excludedUserId)
    ) || null
  );
};

const reassignDirectReports = async (
  input = {},
  legacyUpdatedBy = null
) => {
  /*
    Supports both calls:

    reassignDirectReports({
      managerUser,
      updatedBy,
    });

    reassignDirectReports(
      managerUser,
      updatedBy
    );
  */
  const managerUser =
    input?.managerUser || input;

  const updatedBy =
    input?.updatedBy ||
    legacyUpdatedBy ||
    null;

  const managerId = getId(
    managerUser?._id
  );

  if (!managerId) {
    return {
      movedCount: 0,
      newManager: null,
    };
  }

  let managerRecord = managerUser;

  if (
    !managerRecord.reportingManager &&
    mongoose.Types.ObjectId.isValid(
      managerId
    )
  ) {
    const databaseManager =
      await AdminUser.findById(
        managerId
      )
        .select(
          "fullName email phone role isActive isDeleted reportingManager"
        )
        .lean();

    if (databaseManager) {
      managerRecord =
        databaseManager;
    }
  }

  const replacementManager =
    await findNearestActiveManager({
      startingManagerId:
        managerRecord.reportingManager,
      excludedUserId: managerId,
    });

  const directReportQuery = {
    reportingManager: managerId,
    isDeleted: {
      $ne: true,
    },
  };

  const directReportsCount =
    await AdminUser.countDocuments(
      directReportQuery
    );

  if (directReportsCount === 0) {
    return {
      movedCount: 0,
      newManager:
        replacementManager
          ? createTeamMember(
              replacementManager
            )
          : null,
    };
  }

  const activityTime = new Date();

  const updateData = {
    reportingManager:
      replacementManager?._id || null,
    updatedAt: activityTime,
    lastActivity: {
      action:
        "reporting_reassigned",
      by: updatedBy,
      at: activityTime,
    },
  };

  if (updatedBy) {
    updateData.updatedBy =
      updatedBy;
  }

  const result =
    await AdminUser.updateMany(
      directReportQuery,
      {
        $set: updateData,
      }
    );

  return {
    movedCount:
      result.modifiedCount ??
      result.nModified ??
      0,

    newManager:
      replacementManager
        ? createTeamMember(
            replacementManager
          )
        : null,
  };
};

const getUserTeamDetails = async (user) => {
  const organizationUsers =
    await loadOrganizationUsers();

  const userMap = createUserMap(
    organizationUsers
  );

  const decoratedUser = decorateUser(
    user,
    userMap
  );

  const directReports = organizationUsers
    .filter(
      (teamMember) =>
        getId(teamMember.reportingManager) ===
        String(decoratedUser._id)
    )
    .map((teamMember) =>
      decorateUser(teamMember, userMap)
    )
    .sort((first, second) =>
      first.fullName.localeCompare(
        second.fullName
      )
    );

  return {
    ...decoratedUser,
    directReports,
  };
};

const sortTeamNodes = (nodes) => {
  nodes.sort((first, second) => {
    const roleDifference =
      rolePriority[first.role] -
      rolePriority[second.role];

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return first.fullName.localeCompare(
      second.fullName
    );
  });

  nodes.forEach((node) => {
    sortTeamNodes(node.children);
  });

  return nodes;
};

const createsCircularParentLink = (
  userId,
  managerId,
  userMap
) => {
  const visited = new Set();
  let currentManagerId = managerId;

  while (currentManagerId) {
    if (currentManagerId === userId) {
      return true;
    }

    if (visited.has(currentManagerId)) {
      return true;
    }

    visited.add(currentManagerId);

    const manager = userMap.get(
      currentManagerId
    );

    currentManagerId = manager
      ? getId(manager.reportingManager)
      : null;
  }

  return false;
};

const calculateTeamSize = (node) => {
  const childTeamSize = node.children.reduce(
    (total, child) =>
      total + calculateTeamSize(child),
    0
  );

  node.directReportsCount =
    node.children.length;

  node.teamSize =
    childTeamSize + node.children.length;

  return node.teamSize;
};

const buildOrganizationTree = (
  users,
  options = {}
) => {
  const {
    onlySuperadminRoots = false,
  } = options;

  const userMap = createUserMap(users);

  const nodeMap = new Map(
    users.map((user) => {
      const teamMember =
        createTeamMember(user);

      return [
        String(user._id),
        {
          ...teamMember,
          reportingManagerId: getId(
            user.reportingManager
          ),
          directReportsCount: 0,
          teamSize: 0,
          children: [],
        },
      ];
    })
  );

  const roots = [];

  users.forEach((user) => {
    const userId = String(user._id);
    const managerId = getId(
      user.reportingManager
    );

    const node = nodeMap.get(userId);
    const managerNode = managerId
      ? nodeMap.get(managerId)
      : null;

    /*
      The active Superadmin is the hierarchy root.

      Admin/Employee accounts without an active
      reporting manager are not displayed as separate
      root cards.
    */
    if (
      onlySuperadminRoots &&
      user.role === "superadmin"
    ) {
      roots.push(node);
      return;
    }

    const invalidManagerLink =
      !managerNode ||
      managerId === userId ||
      createsCircularParentLink(
        userId,
        managerId,
        userMap
      );

    if (invalidManagerLink) {
      if (!onlySuperadminRoots) {
        roots.push(node);
      }

      return;
    }

    managerNode.children.push(node);
  });

  sortTeamNodes(roots);

  roots.forEach((rootNode) => {
    calculateTeamSize(rootNode);
  });

  return roots;
};

const getOrganizationTree = async () => {
  const organizationUsers =
    await loadOrganizationUsers();

  /*
    Team hierarchy contains only active accounts.

    An Admin/Employee is displayed only when their
    reporting manager is also active and connected to
    the active Superadmin hierarchy.
  */
  const users =
    organizationUsers.filter(
      (user) => user.isActive === true
    );

  const tree = buildOrganizationTree(
    users,
    {
      onlySuperadminRoots: true,
    }
  );

  const summary = users.reduce(
    (result, user) => {
      result.totalUsers += 1;

      if (user.isActive) {
        result.activeUsers += 1;
      } else {
        result.inactiveUsers += 1;
      }

      if (user.role === "superadmin") {
        result.superadmins += 1;
      }

      if (user.role === "admin") {
        result.admins += 1;
      }

      if (user.role === "employee") {
        result.employees += 1;
      }

      return result;
    },
    {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      superadmins: 0,
      admins: 0,
      employees: 0,
    }
  );

  return {
    tree,
    summary,
  };
};

module.exports = {
  buildOrganizationTree,
  decorateUsersWithHierarchy,
  getOrganizationTree,
  getReportingManagerOptions,
  getUserTeamDetails,
  reassignDirectReports,
  validateReportingManager,
};
