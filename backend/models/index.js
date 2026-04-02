const sequelize = require("../config/database");

// Import models
const User = require("./User");
const Customer = require("./Customer");
const Loan = require("./Loan");
const Payment = require("./Payment");
const FixedDeposit = require("./FixedDeposit");
const AuditLog = require("./AuditLog");
const LoanTransaction = require("./LoanTransaction");

// =============================================
// Associations
// =============================================

// Customer ──< Loans (one-to-many)
Customer.hasMany(Loan, { foreignKey: "customer_id", as: "loans" });
Loan.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

// Loan ──< Payments (one-to-many)
Loan.hasMany(Payment, { foreignKey: "loan_id", as: "payments" });
Payment.belongsTo(Loan, { foreignKey: "loan_id", as: "loan" });

// Loan ──< LoanTransactions (one-to-many)
Loan.hasMany(LoanTransaction, { foreignKey: "loan_id", as: "transactions" });
LoanTransaction.belongsTo(Loan, { foreignKey: "loan_id", as: "loan" });

// Customer ──< FixedDeposits (one-to-many)
Customer.hasMany(FixedDeposit, { foreignKey: "customer_id", as: "fixedDeposits" });
FixedDeposit.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

// User ──< AuditLogs (one-to-many)
User.hasMany(AuditLog, { foreignKey: "user_id", as: "auditLogs" });
AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = {
  sequelize,
  User,
  Customer,
  Loan,
  Payment,
  FixedDeposit,
  AuditLog,
  LoanTransaction,
};
