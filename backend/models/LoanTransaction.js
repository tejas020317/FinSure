const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LoanTransaction = sequelize.define(
  "LoanTransaction",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    loan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "loans",
        key: "loan_id",
      },
      onDelete: 'CASCADE'
    },
    transaction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.ENUM("LOAN_DISBURSEMENT", "PAYMENT", "INTEREST_ENTRY", "WITHDRAWAL"),
      allowNull: false,
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    interest_charged: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    principal_paid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    withdrawal_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    remaining_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
  },
  {
    tableName: "loan_transactions",
    timestamps: true,
    updatedAt: false,
    createdAt: "created_at",
    underscored: true,
  }
);

module.exports = LoanTransaction;
