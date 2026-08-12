const Service = require("../models/serviceModel");

const ACTIVE_SERVICE_FILTER = {
  isActive: true,
};

const escapeRegularExpression = (value = "") => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const formatService = (service) => {
  return {
    id: service.serviceCode,
    serviceCode: service.serviceCode,
    slug: service.slug,
    title: service.title,
    shortDescription: service.shortDescription,
    fullDescription: service.fullDescription,
    category: service.category,
    consultationMode: service.consultationMode,
    duration: service.duration,
    startingPrice: service.startingPrice,
    iconKey: service.iconKey,
    isPopular: service.isPopular,
    features: service.features,
  };
};

const getServices = async (req, res) => {
  try {
    const { search = "", category = "", mode = "", popular = "" } = req.query;

    const query = {
      ...ACTIVE_SERVICE_FILTER,
    };

    const cleanSearch = String(search).trim();

    if (cleanSearch) {
      const searchExpression = new RegExp(
        escapeRegularExpression(cleanSearch),
        "i",
      );

      query.$or = [
        {
          title: searchExpression,
        },
        {
          shortDescription: searchExpression,
        },
        {
          fullDescription: searchExpression,
        },
        {
          category: searchExpression,
        },
        {
          features: searchExpression,
        },
      ];
    }

    if (category && category !== "All") {
      query.category = String(category).trim();
    }

    if (mode && mode !== "All Modes") {
      query.consultationMode = String(mode).trim();
    }

    if (popular === "true") {
      query.isPopular = true;
    }

    const [services, categories] = await Promise.all([
      Service.find(query)
        .sort({
          isPopular: -1,
          serviceCode: 1,
        })
        .lean(),

      Service.distinct("category", ACTIVE_SERVICE_FILTER),
    ]);

    return res.status(200).json({
      success: true,
      count: services.length,

      services: services.map(formatService),

      filters: {
        categories: ["All", ...categories.sort()],

        modes: ["All Modes", "Clinic", "Video", "Home Sample"],
      },
    });
  } catch (error) {
    console.error("Get services error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch healthcare services",
    });
  }
};

const getServiceByIdentifier = async (req, res) => {
  try {
    const identifier = String(req.params.identifier).trim();

    /*
        Inactive service cannot be opened
        using service code or slug.
      */
    const service = await Service.findOne({
      ...ACTIVE_SERVICE_FILTER,

      $or: [
        {
          serviceCode: identifier,
        },
        {
          slug: identifier.toLowerCase(),
        },
      ],
    }).lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Healthcare service not found",
      });
    }

    return res.status(200).json({
      success: true,
      service: formatService(service),
    });
  } catch (error) {
    console.error("Get service details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch healthcare service details",
    });
  }
};

module.exports = {
  getServices,
  getServiceByIdentifier,
};
