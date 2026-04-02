const { Payment, Loan, sequelize } = require("../models");
const loanLedgerService = require("./loanLedgerService");

/**
 * Add a payment against a loan.
 */
const addPayment = async (data) => {
  // Verify loan exists
  const loan = await Loan.findByPk(data.loan_id);
  if (!loan) {
    const error = new Error("Loan not found.");
    error.statusCode = 404;
    throw error;
  }

  const transaction = await sequelize.transaction();

  try {
    // Save to regular payments log first, if desired, 
    // but the ledger must definitely be updated.
    const payment = await Payment.create(data, { transaction });

    // Process payment in ledger (computes interest, allocates, updates balance)
    await loanLedgerService.processPayment(
      data.loan_id, 
      data.payment_amount, 
      data.payment_date, 
      transaction
    );

    await transaction.commit();
    return payment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get all payments for a specific loan, sorted chronologically.
 */
const getPaymentsByLoanId = async (loanId) => {
  // Verify loan exists
  const loan = await Loan.findByPk(loanId);
  if (!loan) {
    const error = new Error("Loan not found.");
    error.statusCode = 404;
    throw error;
  }

  const payments = await Payment.findAll({
    where: { loan_id: loanId },
    order: [["payment_date", "ASC"]],
  });

  return { loan, payments };
};

/**
 * Delete a payment by ID.
 */
const deletePayment = async (id) => {
  const payment = await Payment.findByPk(id);
  if (!payment) {
    const error = new Error("Payment not found.");
    error.statusCode = 404;
    throw error;
  }

  await payment.destroy();
  return { message: "Payment deleted successfully." };
};

module.exports = { addPayment, getPaymentsByLoanId, deletePayment };
