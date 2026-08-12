const User = require("../models/userModel");

exports.getAllClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const skip = (page - 1) * limit;
    
    const query = { isDeleted: false };
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }
    
    const clients = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        clients,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { 
      fullName, email, phone, password, 
      companyName, designation, address, city, state, pincode 
    } = req.body;
    
    // Check Email Uniqueness
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check Phone Uniqueness
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already registered",
      });
    }
    
    const newClient = await User.create({
      fullName,
      email,
      phone,
      password,
      companyName,
      designation,
      address,
      city,
      state,
      pincode
    });
    
    const clientResponse = newClient.toObject();
    delete clientResponse.password;
    
    res.status(201).json({
      success: true,
      data: {
        client: clientResponse,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getClient = async (req, res) => {
  try {
    const client = await User.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    }).select("-password");
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: { client },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { 
      fullName, email, phone, 
      companyName, designation, address, city, state, pincode 
    } = req.body;
    
    // Check Email Uniqueness (excluding current user)
    const existingEmail = await User.findOne({
      email,
      _id: { $ne: req.params.id }
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check Phone Uniqueness (excluding current user)
    const existingPhone = await User.findOne({
      phone,
      _id: { $ne: req.params.id }
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already registered",
      });
    }
    
    const updatedClient = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { fullName, email, phone, companyName, designation, address, city, state, pincode },
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: { client: updatedClient },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleClientStatus = async (req, res) => {
  try {
    const client = await User.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    
    client.isActive = !client.isActive;
    client.deactivatedAt = client.isActive ? null : new Date();
    client.activatedAt = client.isActive ? new Date() : null;
    
    await client.save();
    
    res.status(200).json({
      success: true,
      data: { client },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), isActive: false },
      { new: true }
    );
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};