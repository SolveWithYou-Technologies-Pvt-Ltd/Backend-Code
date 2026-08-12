const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "adminprofilepicture"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const extensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination(
    req,
    file,
    callback
  ) {
    callback(
      null,
      uploadDirectory
    );
  },

  filename(
    req,
    file,
    callback
  ) {
    const extension =
      extensionByMimeType[
        file.mimetype
      ] || ".jpg";

    const uniqueName = [
      "admin",
      req.userId,
      Date.now(),
    ].join("-");

    callback(
      null,
      `${uniqueName}${extension}`
    );
  },
});

const fileFilter = (
  req,
  file,
  callback
) => {
  if (
    !allowedMimeTypes.has(
      file.mimetype
    )
  ) {
    callback(
      new Error(
        "Only JPG, PNG and WEBP images are allowed"
      )
    );

    return;
  }

  callback(null, true);
};

const profilePictureUpload =
  multer({
    storage,
    fileFilter,

    limits: {
      fileSize:
        5 * 1024 * 1024,
    },
  });

const uploadAdminProfilePicture = (
  req,
  res,
  next
) => {
  profilePictureUpload.single(
    "profileImage"
  )(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Profile picture must be smaller than 5 MB",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to upload profile picture",
    });
  });
};

module.exports = {
  uploadAdminProfilePicture,
  uploadDirectory,
};
