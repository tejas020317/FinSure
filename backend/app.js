const express = require("express");
const cors = require("cors");
const { authenticate } = require("./middleware/auth");

const app = express();

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Public Routes ---------------
// Health-check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Auth routes (register / login) — no token required
app.use("/api/auth", require("./routes/authRoutes"));

// --------------- Protected Routes ---------------
// Everything below this line requires a valid JWT
app.use("/api", authenticate);

// Customer routes (protected)
app.use("/api/customers", require("./routes/customerRoutes"));

// Loan routes (protected)
app.use("/api/loans", require("./routes/loanRoutes"));

// Payment routes (protected)
app.use("/api/payments", require("./routes/paymentRoutes"));

// Fixed Deposit routes (protected)
app.use("/api/fixed-deposits", require("./routes/fixedDepositRoutes"));

// Dashboard routes (protected)
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// Report routes (protected)
app.use("/api/reports", require("./routes/reportRoutes"));

module.exports = app;
