const { getDashboardStats, getDashboardCharts } = require("../services/dashboardService");

/** GET /api/dashboard */
const getDashboard = async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });    
  }
};

/** GET /api/dashboard/charts */
const getCharts = async (_req, res) => {
  try {
    const charts = await getDashboardCharts();
    return res.status(200).json({ success: true, data: charts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getCharts };
