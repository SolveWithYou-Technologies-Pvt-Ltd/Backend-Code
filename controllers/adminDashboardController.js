const {
  getDashboardOverview,
} = require("../services/adminDashboardService");

const getAdminDashboardOverview = async (
  req,
  res,
  next
) => {
  try {
    const dashboardData =
      await getDashboardOverview();

    return res.status(200).json({
      success: true,
      message:
        "Dashboard analytics fetched successfully",
      data: dashboardData,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminDashboardOverview,
};
