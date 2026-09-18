require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminServiceRoutes = require("./routes/adminServiceRoutes");
const clientRoutes = require("./routes/clientRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const JobRoutes = require("./routes/jobRoutes");
const jobApplicationRoutes = require("./routes/jobApplicationRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const clientProjectRoutes = require("./routes/clientProjectRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const userDashboardRoutes = require("./routes/userDashboardRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const connectDB = require("./config/db");

const app = express();

const corsOptions = {
  origin: [
    "https://www.solvewithyou.in",
    "https://solvewithyou.in",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.set("trust proxy", 1);

app.use(cors(corsOptions));

app.options(/(.*)/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Express server is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/admin/services", adminServiceRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/clients", clientRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/jobs", JobRoutes);
app.use("/api/applications", jobApplicationRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/clientprojects", clientProjectRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/user-dashboard", userDashboardRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
});

app.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;