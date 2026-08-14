const Service = require("../models/serviceModel");

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const latestService = await Service.findOne({
      serviceId: new RegExp(`^SWY/${currentYear}/`, "i")
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    
    if (latestService && latestService.serviceId) {
      const parts = latestService.serviceId.split('/');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }
    }

    const generatedServiceId = `SWY/${currentYear}/${nextNumber.toString().padStart(2, '0')}`;

    const serviceData = {
      ...req.body,
      serviceId: generatedServiceId
    };

    const service = await Service.create(serviceData);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Service ID already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Service ID already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    service.isActive = !service.isActive;
    await service.save();
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    res.status(200).json({ success: true, message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};