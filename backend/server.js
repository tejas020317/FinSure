require("dotenv").config();

const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

// ---------- Start Server ----------
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Sync models (in development only — use migrations in production)
    await sequelize.sync({ alter: false });
    console.log("✅ Models synchronised.");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error.message || error);
    process.exit(1);
  }
};

startServer();
