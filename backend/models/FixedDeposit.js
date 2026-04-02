const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FixedDeposit = sequelize.define(
  "FixedDeposit",
  {
    fd_id: {
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
    deposit_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    interest_type: {
      type: DataTypes.ENUM("simple", "compound"),
      allowNull: false,
      defaultValue: "simple",
    },
    compounding_frequency: {
      type: DataTypes.ENUM("monthly", "quarterly", "half_yearly", "yearly"),
      allowNull: true,
      defaultValue: "quarterly",
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    duration_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "fixed_deposits",
    timestamps: true,
    underscored: true,
  }
);

module.exports = FixedDeposit;
