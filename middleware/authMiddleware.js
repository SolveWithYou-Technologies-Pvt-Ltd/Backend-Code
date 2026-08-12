const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization || "";

    if (!authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "login is required",
      });
    }

    const token = authorizationHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "login is required",
      });
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decodedToken.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }
    req.userId = decodedToken.id;
    next();
  } catch (error) {
    const message = error.name === "TokenExpiredError" ? "Authentication token has expired" : "Invalid authentication token";
    return res.status(401).json({
      success: false,
      message,
    });
  }
};

module.exports = verifyToken;
