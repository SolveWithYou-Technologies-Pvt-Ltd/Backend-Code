const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const { 
  sendClientRegisteredEmail, 
  sendClientUpdatedEmail, 
  sendClientStatusChangedEmail, 
  sendClientDeletedEmail 
} = require("../services/emails/clientEmailSender");

const profileFields = [
  "fullName",
  "profilePhoto",
  "companyName",
  "designation",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "pincode",
];

const getProfileCompletion = (user) => {
  const completedFields = profileFields.filter((field) => {
    const value = user[field];
    if (typeof value === "string") {
      return Boolean(value.trim());
    }
    return Boolean(value);
  }).length;

  return {
    completedFields,
    totalFields: profileFields.length,
    percentage: Math.round((completedFields / profileFields.length) * 100),
  };
};

const getProfilePhotoUrl = (req, photoPath) => {
  if (!photoPath) {
    return "";
  }
  const normalizedPath = String(photoPath).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }
  return `${req.protocol}://${req.get("host")}/${normalizedPath.replace(/^\/+/, "")}`;
};

const formatUser = (user, req) => ({
  id: user._id,
  fullName: user.fullName,
  profilePhoto: getProfilePhotoUrl(req, user.profilePhoto),
  companyName: user.companyName || "",
  designation: user.designation || "",
  phone: user.phone,
  email: user.email,
  address: user.address || "",
  city: user.city || "",
  state: user.state || "",
  pincode: user.pincode || "",
  isActive: user.isActive !== false,
  profileCompletion: getProfileCompletion(user),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const removeFile = (filePath) => {
  if (!filePath) {
    return;
  }
  fs.unlink(filePath, () => {});
};

const removeStoredProfilePhoto = (relativePath) => {
  if (!relativePath) {
    return;
  }
  const absolutePath = path.join(__dirname, "..", relativePath);
  removeFile(absolutePath);
};

const registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === normalizedEmail
            ? "Email address is already registered"
            : "Phone number is already registered",
      });
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
    });

    const token = generateToken(user._id.toString());

    sendClientRegisteredEmail(user.email, user.fullName, "User").catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: formatUser(user, req),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isDeleted === true) {
      return res.status(403).json({
        success: false,
        message: "This account is no longer available",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated by admin",
      });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: formatUser(user, req),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || user.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated by admin",
      });
    }

    return res.status(200).json({
      success: true,
      user: formatUser(user, req),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch user details",
    });
  }
};

const updateUserProfile = async (req, res) => {
  const newUploadedFilePath = req.file?.path;

  try {
    const user = await User.findById(req.userId);

    if (!user || user.isDeleted === true) {
      removeFile(newUploadedFilePath);
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (user.isActive === false) {
      removeFile(newUploadedFilePath);
      return res.status(403).json({
        success: false,
        message: "Account is deactivated by admin",
      });
    }

    const {
      fullName,
      companyName,
      designation,
      phone,
      email,
      address,
      city,
      state,
      pincode,
    } = req.body;

    const normalizedName = fullName?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();
    const normalizedPincode = pincode?.trim() || "";

    if (!normalizedName || !normalizedEmail || !normalizedPhone) {
      removeFile(newUploadedFilePath);
      return res.status(400).json({
        success: false,
        message: "Full name, email address, and phone number are required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      removeFile(newUploadedFilePath);
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    if (normalizedPincode && !/^\d{6}$/.test(normalizedPincode)) {
      removeFile(newUploadedFilePath);
      return res.status(400).json({
        success: false,
        message: "Pincode must contain exactly 6 digits",
      });
    }

    const duplicateUser = await User.findOne({
      _id: { $ne: user._id },
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (duplicateUser) {
      removeFile(newUploadedFilePath);
      return res.status(409).json({
        success: false,
        message:
          duplicateUser.email === normalizedEmail
            ? "Email address is already registered"
            : "Phone number is already registered",
      });
    }

    const previousProfilePhoto = user.profilePhoto;

    user.fullName = normalizedName;
    user.companyName = companyName?.trim() || undefined;
    user.designation = designation?.trim() || undefined;
    user.phone = normalizedPhone;
    user.email = normalizedEmail;
    user.address = address?.trim() || "";
    user.city = city?.trim() || "";
    user.state = state?.trim() || "";
    user.pincode = normalizedPincode;

    if (req.file) {
      user.profilePhoto = path
        .join("uploads", "profilepictures", req.file.filename)
        .replace(/\\/g, "/");
    }

    await user.save();

    sendClientUpdatedEmail(user.email, user.fullName, "User").catch(() => {});

    if (req.file && previousProfilePhoto) {
      removeStoredProfilePhoto(previousProfilePhoto);
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: formatUser(user, req),
    });
  } catch (error) {
    removeFile(newUploadedFilePath);

    if (error.name === "ValidationError") {
      const firstValidationError = Object.values(error.errors)[0];
      return res.status(400).json({
        success: false,
        message:
          firstValidationError?.message ||
          "Please provide valid profile information",
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message:
          duplicateField === "email"
            ? "Email address is already registered"
            : "Phone number is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

const ADMIN_CLIENT_PAGE_SIZE = 10;

const cleanAdminText = (value = "") => String(value ?? "").trim();
const cleanAdminEmail = (value = "") => cleanAdminText(value).toLowerCase();
const cleanAdminPhone = (value = "") => String(value ?? "").replace(/\D/g, "");

const parseAdminBoolean = (value, fallback = false) => {
  if (value === true || value === "true") {
    return true;
  }
  if (value === false || value === "false") {
    return false;
  }
  return fallback;
};

const formatAdminActor = (actor) => {
  if (!actor) {
    return null;
  }
  if (typeof actor === "string" || !actor.fullName) {
    return {
      _id: actor._id || actor,
      fullName: "",
      employeeCode: "",
      email: "",
      role: "",
    };
  }
  return {
    _id: actor._id,
    fullName: actor.fullName || "",
    employeeCode: actor.employeeCode || "",
    email: actor.email || "",
    role: actor.role || "",
  };
};

const formatAdminClient = (user, req) => {
  const plainUser = typeof user?.toObject === "function" ? user.toObject() : user;

  return {
    _id: plainUser._id,
    id: plainUser._id,
    fullName: plainUser.fullName,
    profilePhoto: getProfilePhotoUrl(req, plainUser.profilePhoto),
    profilePhotoPath: plainUser.profilePhoto || "",
    companyName: plainUser.companyName || "",
    designation: plainUser.designation || "",
    phone: plainUser.phone,
    email: plainUser.email,
    address: plainUser.address || "",
    city: plainUser.city || "",
    state: plainUser.state || "",
    pincode: plainUser.pincode || "",
    isActive: plainUser.isActive !== false,
    deactivatedAt: plainUser.deactivatedAt,
    deactivatedBy: formatAdminActor(plainUser.deactivatedBy),
    activatedAt: plainUser.activatedAt,
    activatedBy: formatAdminActor(plainUser.activatedBy),
    profileCompletion: getProfileCompletion(plainUser),
    createdAt: plainUser.createdAt,
    updatedAt: plainUser.updatedAt,
  };
};

const populateClientAdminActors = (query) => {
  return query
    .populate("deactivatedBy", "fullName employeeCode email role")
    .populate("activatedBy", "fullName employeeCode email role")
    .populate("deletedBy", "fullName employeeCode email role");
};

const sendAdminClientError = (res, error, fallbackMessage) => {
  if (error.name === "ValidationError") {
    const firstError = Object.values(error.errors)[0];
    return res.status(400).json({
      success: false,
      message: firstError?.message || fallbackMessage,
    });
  }

  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];
    return res.status(409).json({
      success: false,
      message:
        duplicateField === "email"
          ? "Email address is already registered"
          : duplicateField === "phone"
          ? "Phone number is already registered"
          : "Client details already exist",
    });
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

const getAdminClients = async (req, res) => {
  try {
    const parsedPage = Number.parseInt(req.query.page, 10);
    const requestedPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const { search = "", status = "all" } = req.query;

    const query = {
      isDeleted: { $ne: true },
    };

    if (status === "active") {
      query.isActive = { $ne: false };
    }
    if (status === "inactive") {
      query.isActive = false;
    }

    const cleanSearch = cleanAdminText(search);

    if (cleanSearch) {
      const searchExpression = new RegExp(
        cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      query.$or = [
        { fullName: searchExpression },
        { email: searchExpression },
        { phone: searchExpression },
        { companyName: searchExpression },
        { city: searchExpression },
      ];
    }

    const totalRecords = await User.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalRecords / ADMIN_CLIENT_PAGE_SIZE));
    const currentPage = Math.min(requestedPage, totalPages);
    const skip = (currentPage - 1) * ADMIN_CLIENT_PAGE_SIZE;

    const clients = await populateClientAdminActors(
      User.find(query)
        .select("-password -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(ADMIN_CLIENT_PAGE_SIZE)
    ).lean();

    const firstRecord = totalRecords === 0 ? 0 : skip + 1;
    const lastRecord = totalRecords === 0 ? 0 : Math.min(skip + clients.length, totalRecords);

    return res.status(200).json({
      success: true,
      data: {
        clients: clients.map((client) => formatAdminClient(client, req)),
        pagination: {
          currentPage,
          pageSize: ADMIN_CLIENT_PAGE_SIZE,
          totalPages,
          totalRecords,
          firstRecord,
          lastRecord,
          hasPreviousPage: currentPage > 1,
          hasNextPage: currentPage < totalPages,
        },
      },
    });
  } catch (error) {
    return sendAdminClientError(res, error, "Unable to load clients");
  }
};

const getAdminClientById = async (req, res) => {
  try {
    const client = await populateClientAdminActors(
      User.findOne({
        _id: req.params.id,
        isDeleted: { $ne: true },
      }).select("-password -__v")
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client was not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        client: formatAdminClient(client, req),
      },
    });
  } catch (error) {
    return sendAdminClientError(res, error, "Unable to load client details");
  }
};

const createAdminClient = async (req, res) => {
  try {
    const fullName = cleanAdminText(req.body.fullName);
    const email = cleanAdminEmail(req.body.email);
    const phone = cleanAdminPhone(req.body.phone);
    const password = String(req.body.password || "");

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, phone number and password are required",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const duplicate = await User.findOne({
      $or: [{ email }, { phone }],
    })
      .select("email phone")
      .lean();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          duplicate.email === email
            ? "Email address is already registered"
            : "Phone number is already registered",
      });
    }

    const client = await User.create({
      fullName,
      email,
      phone,
      password,
      isActive: true,
      isDeleted: false,
    });

    sendClientRegisteredEmail(client.email, client.fullName, "Admin").catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: {
        client: formatAdminClient(client, req),
      },
    });
  } catch (error) {
    return sendAdminClientError(res, error, "Unable to create client");
  }
};

const updateAdminClient = async (req, res) => {
  try {
    const client = await User.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client was not found",
      });
    }

    const fullName = cleanAdminText(req.body.fullName);
    const email = cleanAdminEmail(req.body.email);
    const phone = cleanAdminPhone(req.body.phone);

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and phone number are required",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    const pincode = cleanAdminText(req.body.pincode);

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain exactly 6 digits",
      });
    }

    const duplicate = await User.findOne({
      _id: { $ne: client._id },
      $or: [{ email }, { phone }],
    })
      .select("email phone")
      .lean();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          duplicate.email === email
            ? "Email address is already registered"
            : "Phone number is already registered",
      });
    }

    client.fullName = fullName;
    client.email = email;
    client.phone = phone;
    client.profilePhoto = cleanAdminText(req.body.profilePhotoPath || req.body.profilePhoto);
    client.companyName = cleanAdminText(req.body.companyName) || undefined;
    client.designation = cleanAdminText(req.body.designation) || undefined;
    client.address = cleanAdminText(req.body.address);
    client.city = cleanAdminText(req.body.city);
    client.state = cleanAdminText(req.body.state);
    client.pincode = pincode;

    const newPassword = String(req.body.password || "");

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least 6 characters",
        });
      }
      client.password = newPassword;
    }

    await client.save();

    const updatedClient = await populateClientAdminActors(
      User.findById(client._id).select("-password -__v")
    );

    sendClientUpdatedEmail(updatedClient.email, updatedClient.fullName, "Admin").catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: {
        client: formatAdminClient(updatedClient, req),
      },
    });
  } catch (error) {
    return sendAdminClientError(res, error, "Unable to update client");
  }
};

const changeAdminClientStatus = async (req, res) => {
  try {
    if (
      typeof req.body?.isActive !== "boolean" &&
      !["true", "false"].includes(req.body?.isActive)
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const client = await User.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client was not found",
      });
    }

    const isActive = parseAdminBoolean(req.body.isActive);
    client.isActive = isActive;

    if (isActive) {
      client.activatedAt = new Date();
      client.activatedBy = req.userId;
      client.deactivatedAt = null;
      client.deactivatedBy = null;
    } else {
      client.deactivatedAt = new Date();
      client.deactivatedBy = req.userId;
      client.activatedAt = null;
      client.activatedBy = null;
    }

    await client.save();

    const updatedClient = await populateClientAdminActors(
      User.findById(client._id).select("-password -__v")
    );

    sendClientStatusChangedEmail(updatedClient.email, updatedClient.fullName, isActive).catch(() => {});

    return res.status(200).json({
      success: true,
      message: isActive ? "Client activated successfully" : "Client deactivated successfully",
      data: {
        client: formatAdminClient(updatedClient, req),
      },
    });
  } catch (error) {
    return sendAdminClientError(res, error, "Unable to update client status");
  }
};

const deleteAdminClient = async (req, res) => {
  try {
    const client = await User.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client was not found",
      });
    }

    client.isDeleted = true;
    client.deletedAt = new Date();
    client.deletedBy = req.userId;
    client.isActive = false;
    client.deactivatedAt = client.deactivatedAt || new Date();
    client.deactivatedBy = client.deactivatedBy || req.userId;

    await client.save();

    sendClientDeletedEmail(client.email, client.fullName).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Client deleted successfully",
      data: {
        deletedClient: {
          _id: client._id,
          fullName: client.fullName,
          email: client.email,
        },
      },
    });
  } catch (error) {
    return sendAdminClientError(res, error, "Unable to delete client");
  }
};

module.exports = {
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
};