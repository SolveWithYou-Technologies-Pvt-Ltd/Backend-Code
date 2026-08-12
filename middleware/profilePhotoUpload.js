const fs = require("fs");
const path = require("path");
const multer = require("multer");

const profilePhotoDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "profilepictures"
);

fs.mkdirSync(profilePhotoDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, profilePhotoDirectory);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueName = `profile-${req.userId}-${Date.now()}${extension}`;

    callback(null, uniqueName);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Only JPG, PNG, and WEBP images are allowed"));
      return;
    }

    callback(null, true);
  },
});

const uploadProfilePhoto = (req, res, next) => {
  upload.single("profilePhoto")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Profile picture must be smaller than 5 MB"
          : error.message;

      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: error.message || "Unable to upload profile picture",
    });
  });
};

module.exports = uploadProfilePhoto;
