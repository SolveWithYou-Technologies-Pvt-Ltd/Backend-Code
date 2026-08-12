const mongoose = require(
  "mongoose"
);

const Service = require(
  "../models/serviceModel"
);

const {
  generateServiceCode,
} = require(
  "../services/serviceCodeService"
);

const CONSULTATION_MODES = [
  "Clinic",
  "Video",
  "Home Sample",
];

const escapeRegularExpression = (
  value = ""
) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const cleanStringArray = (
  values
) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((value) =>
          String(value || "").trim()
        )
        .filter(Boolean)
    ),
  ];
};

const cleanModes = (
  values
) => {
  return cleanStringArray(
    values
  ).filter((mode) =>
    CONSULTATION_MODES.includes(
      mode
    )
  );
};

const createSlug = (
  value = ""
) => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
};

const toBoolean = (
  value,
  defaultValue = false
) => {
  if (
    value === true ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false"
  ) {
    return false;
  }

  return defaultValue;
};

const formatAdminService = (
  service
) => {
  const plainService =
    typeof service.toObject ===
    "function"
      ? service.toObject()
      : service;

  return {
    _id: plainService._id,
    serviceCode:
      plainService.serviceCode,
    slug: plainService.slug,
    title: plainService.title,
    shortDescription:
      plainService.shortDescription,
    fullDescription:
      plainService.fullDescription,
    category:
      plainService.category,

    consultationMode:
      plainService
        .consultationMode || [],

    duration:
      plainService.duration,

    startingPrice:
      plainService.startingPrice,

    iconKey:
      plainService.iconKey,

    isPopular:
      plainService.isPopular ===
      true,

    features:
      plainService.features || [],

    isActive:
      plainService.isActive ===
      true,

    createdAt:
      plainService.createdAt,

    updatedAt:
      plainService.updatedAt,
  };
};

const createIdentifierQuery = (
  identifier
) => {
  const cleanIdentifier =
    String(identifier || "").trim();

  const conditions = [
    {
      serviceCode:
        cleanIdentifier,
    },
    {
      slug:
        cleanIdentifier.toLowerCase(),
    },
  ];

  if (
    mongoose.Types.ObjectId.isValid(
      cleanIdentifier
    )
  ) {
    conditions.unshift({
      _id: cleanIdentifier,
    });
  }

  return {
    $or: conditions,
  };
};

const findService = (
  identifier
) => {
  return Service.findOne(
    createIdentifierQuery(
      identifier
    )
  );
};

const createUniqueSlug = async (
  title,
  serviceCode,
  excludedId = null
) => {
  const baseSlug =
    createSlug(title) ||
    `service-${serviceCode}`;

  for (
    let attempt = 0;
    attempt < 100;
    attempt += 1
  ) {
    const candidate =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${serviceCode}${
            attempt > 1
              ? `-${attempt}`
              : ""
          }`;

    const query = {
      slug: candidate,
    };

    if (excludedId) {
      query._id = {
        $ne: excludedId,
      };
    }

    const alreadyExists =
      await Service.exists(
        query
      );

    if (!alreadyExists) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to generate unique service slug"
  );
};

const applyServiceData = (
  service,
  data
) => {
  const stringFields = [
    "title",
    "shortDescription",
    "fullDescription",
    "category",
    "duration",
    "iconKey",
  ];

  stringFields.forEach(
    (fieldName) => {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          fieldName
        )
      ) {
        service[fieldName] =
          String(
            data[fieldName] ||
            ""
          ).trim();
      }
    }
  );

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "consultationMode"
    )
  ) {
    service.consultationMode =
      cleanModes(
        data.consultationMode
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "startingPrice"
    )
  ) {
    service.startingPrice =
      Number(
        data.startingPrice
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "features"
    )
  ) {
    service.features =
      cleanStringArray(
        data.features
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "isPopular"
    )
  ) {
    service.isPopular =
      toBoolean(
        data.isPopular
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "isActive"
    )
  ) {
    service.isActive =
      toBoolean(
        data.isActive,
        true
      );
  }
};

const sendControllerError = (
  res,
  error,
  fallbackMessage
) => {
  if (
    error.name ===
    "ValidationError"
  ) {
    const validationError =
      Object.values(
        error.errors
      )[0];

    return res.status(400).json({
      success: false,
      message:
        validationError?.message ||
        fallbackMessage,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message:
        "Service code or slug already exists",
    });
  }

  console.error(
    fallbackMessage,
    error
  );

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

const getAdminServices =
  async (req, res) => {
    try {
      const pageSize = 10;

      const parsedPage =
        Number.parseInt(
          req.query.page,
          10
        );

      const requestedPage =
        Number.isInteger(
          parsedPage
        ) &&
        parsedPage > 0
          ? parsedPage
          : 1;

      const {
        search = "",
        status = "all",
        mode = "all",
        category = "",
      } = req.query;

      const query = {};

      if (status === "active") {
        query.isActive = true;
      }

      if (status === "inactive") {
        query.isActive = false;
      }

      if (
        mode &&
        mode !== "all"
      ) {
        query.consultationMode =
          String(mode).trim();
      }

      if (
        String(category).trim()
      ) {
        query.category =
          String(category).trim();
      }

      const cleanSearch =
        String(search).trim();

      if (cleanSearch) {
        const searchExpression =
          new RegExp(
            escapeRegularExpression(
              cleanSearch
            ),
            "i"
          );

        query.$or = [
          {
            serviceCode:
              searchExpression,
          },
          {
            title:
              searchExpression,
          },
          {
            category:
              searchExpression,
          },
          {
            shortDescription:
              searchExpression,
          },
          {
            features:
              searchExpression,
          },
        ];
      }

      const totalRecords =
        await Service.countDocuments(
          query
        );

      const totalPages =
        Math.max(
          1,
          Math.ceil(
            totalRecords /
            pageSize
          )
        );

      const currentPage =
        Math.min(
          requestedPage,
          totalPages
        );

      const skip =
        (currentPage - 1) *
        pageSize;

      const [
        services,
        categories,
      ] = await Promise.all([
        Service.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(pageSize)
          .lean(),

        Service.distinct(
          "category"
        ),
      ]);

      const firstRecord =
        totalRecords === 0
          ? 0
          : skip + 1;

      const lastRecord =
        totalRecords === 0
          ? 0
          : Math.min(
              skip +
                services.length,
              totalRecords
            );

      return res.status(200).json({
        success: true,

        data: {
          services:
            services.map(
              formatAdminService
            ),

          filters: {
            categories:
              categories.sort(),

            modes:
              CONSULTATION_MODES,
          },

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
      return sendControllerError(
        res,
        error,
        "Unable to load services"
      );
    }
  };

const getAdminService =
  async (req, res) => {
    try {
      const service =
        await findService(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service was not found",
        });
      }

      return res.status(200).json({
        success: true,

        data: {
          service:
            formatAdminService(
              service
            ),
        },
      });
    } catch (error) {
      return sendControllerError(
        res,
        error,
        "Unable to load service details"
      );
    }
  };

const createAdminService =
  async (req, res) => {
    try {
      const serviceCode =
        await generateServiceCode();

      const service =
        new Service({
          serviceCode,
          slug:
            `service-${serviceCode}`,
          consultationMode: [],
          features: [],
          isPopular: false,
          isActive: true,
        });

      applyServiceData(
        service,
        req.body || {}
      );

      service.slug =
        await createUniqueSlug(
          service.title,
          serviceCode
        );

      await service.save();

      return res.status(201).json({
        success: true,
        message:
          "Service added successfully",

        data: {
          service:
            formatAdminService(
              service
            ),
        },
      });
    } catch (error) {
      return sendControllerError(
        res,
        error,
        "Unable to add service"
      );
    }
  };

const updateAdminService =
  async (req, res) => {
    try {
      const service =
        await findService(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service was not found",
        });
      }

      const previousTitle =
        service.title;

      applyServiceData(
        service,
        req.body || {}
      );

      if (
        service.title !==
        previousTitle
      ) {
        service.slug =
          await createUniqueSlug(
            service.title,
            service.serviceCode,
            service._id
          );
      }

      await service.save();

      return res.status(200).json({
        success: true,
        message:
          "Service updated successfully",

        data: {
          service:
            formatAdminService(
              service
            ),
        },
      });
    } catch (error) {
      return sendControllerError(
        res,
        error,
        "Unable to update service"
      );
    }
  };

const changeAdminServiceStatus =
  async (req, res) => {
    try {
      const service =
        await findService(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service was not found",
        });
      }

      if (
        typeof req.body?.isActive !==
          "boolean" &&
        ![
          "true",
          "false",
        ].includes(
          req.body?.isActive
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false",
        });
      }

      service.isActive =
        toBoolean(
          req.body.isActive
        );

      await service.save();

      return res.status(200).json({
        success: true,

        message:
          service.isActive
            ? "Service activated successfully"
            : "Service deactivated successfully",

        data: {
          service:
            formatAdminService(
              service
            ),
        },
      });
    } catch (error) {
      return sendControllerError(
        res,
        error,
        "Unable to update service status"
      );
    }
  };

const deleteAdminService =
  async (req, res) => {
    try {
      const service =
        await findService(
          req.params.id
        );

      if (!service) {
        return res.status(404).json({
          success: false,
          message:
            "Service was not found",
        });
      }

      await Service.deleteOne({
        _id: service._id,
      });

      return res.status(200).json({
        success: true,
        message:
          "Service deleted successfully",

        data: {
          deletedService: {
            _id: service._id,
            serviceCode:
              service.serviceCode,
            title:
              service.title,
          },
        },
      });
    } catch (error) {
      return sendControllerError(
        res,
        error,
        "Unable to delete service"
      );
    }
  };

module.exports = {
  getAdminServices,
  getAdminService,
  createAdminService,
  updateAdminService,
  changeAdminServiceStatus,
  deleteAdminService,
};
