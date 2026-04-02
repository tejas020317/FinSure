const express = require("express");
const router = express.Router();
const { getDashboard, getCharts } = require("../controllers/dashboardController");

// GET /api/dashboard
router.get("/", getDashboard);

// GET /api/dashboard/charts
router.get("/charts", getCharts);

module.exports = router;
