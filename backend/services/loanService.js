const { Loan, Customer, Payment, sequelize } = require("../models");
const loanLedgerService = require("./loanLedgerService");

/**
 * Create a new loan for a customer.
 */
const createLoan = async (data) => {
  // Verify customer exists
  const customer = await Customer.findByPk(data.customer_id);
  if (!customer) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    throw error;
  }

  const transaction = await sequelize.transaction();

  try {
    const loan = await Loan.create(data, { transaction });
    
    // Create initial disbursement entry in ledger
    await loanLedgerService.recordLoanDisbursement(
      loan.loan_id, 
      loan.loan_amount, 
      loan.loan_start_date, 
      transaction
    );

    await transaction.commit();
    return loan;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get all loans (with associated customer info).
 */
const getAllLoans = async () => {
  return await Loan.findAll({
    include: [{ association: "customer", attributes: ["customer_id", "name", "account_number"] }],
    order: [["created_at", "DESC"]],
  });
};

/**
 * Get a single loan by ID (with customer + payments).
 */
const getLoanById = async (id) => {
  const loan = await Loan.findByPk(id, {
    include: [
      { association: "customer", attributes: ["customer_id", "name", "phone", "account_number"] },
      { association: "payments", order: [["payment_date", "DESC"]] },
    ],
  });

  if (!loan) {
    const error = new Error("Loan not found.");
    error.statusCode = 404;
    throw error;
  }

  return loan;
};

/**
 * Delete a loan by ID.
 */
const deleteLoan = async (id) => {
  const loan = await Loan.findByPk(id);
  if (!loan) {
    const error = new Error("Loan not found.");
    error.statusCode = 404;
    throw error;
  }

  await loan.destroy();
  return { message: "Loan deleted successfully." };
};

module.exports = { createLoan, getAllLoans, getLoanById, deleteLoan };
