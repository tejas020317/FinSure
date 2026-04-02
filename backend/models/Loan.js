const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Loan = sequelize.define(
  "Loan",
  {
    loan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "customers",
        key: "customer_id",
      },
    },
    loan_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    interest_type: {
      type: DataTypes.ENUM("simple", "compound", "reducing"),
      allowNull: false,
      defaultValue: "simple",
    },
    calculation_type: {
      type: DataTypes.ENUM("daily", "monthly", "ANNUAL_MONTHLY_REDUCING", "ANNUAL_DAILY_REDUCING", "SIMPLE", "COMPOUND"),
      allowNull: false,
      defaultValue: "monthly",
    },
    loan_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    duration_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "loans",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Loan;
