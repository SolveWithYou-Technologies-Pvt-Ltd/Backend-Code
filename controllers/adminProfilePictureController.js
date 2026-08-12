const fs = require("fs");
const path = require("path");

const AdminUser = require(
  "../models/AdminUser"
);

const {
  setLastActivity,
} = require(
  "../services/userAuditService"
);

const {
  uploadDirectory,
} = require(
  "../middleware/adminProfilePictureUpload"
);

const deleteOldProfilePicture = (
  profileImage
) => {
  if (
    !profileImage ||
    !profileImage.startsWith(
      "/uploads/adminprofilepicture/"
    )
  ) {
    return;
  }

  const fileName =
    path.basename(profileImage);

  const filePath = path.join(
    uploadDirectory,
    fileName
  );

  fs.promises.unlink(filePath).catch(
    () => {
      // The old file may already be missing.
    }
  );
};

const updateAdminProfilePicture =
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a profile picture",
        });
      }

      const adminUser =
        await AdminUser.findOne({
          _id: req.userId,

          isDeleted: {
            $ne: true,
          },
        });

      if (!adminUser) {
        await fs.promises
          .unlink(req.file.path)
          .catch(() => {});

        return res.status(404).json({
          success: false,
          message:
            "Admin account was not found",
        });
      }

      const previousImage =
        adminUser.profileImage;

      adminUser.profileImage =
        `/uploads/adminprofilepicture/${req.file.filename}`;

      setLastActivity(
        adminUser,
        "profile_updated",
        adminUser._id
      );

      await adminUser.save();

      deleteOldProfilePicture(
        previousImage
      );

      const updatedProfile =
        await AdminUser.findById(
          adminUser._id
        )
          .select("-password")
          .populate(
            "reportingManager",
            "fullName email phone role isActive"
          );

      return res.status(200).json({
        success: true,
        message:
          "Profile picture updated successfully",

        data: {
          profile:
            updatedProfile,
        },
      });
    } catch (error) {
      console.error(
        "Update admin profile picture error:",
        error
      );

      if (req.file?.path) {
        await fs.promises
          .unlink(req.file.path)
          .catch(() => {});
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update profile picture",
      });
    }
  };

module.exports = {
  updateAdminProfilePicture,
};
