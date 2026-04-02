const { Loan, Payment, FixedDeposit, Customer, LoanTransaction } = require("../models");
const loanLedgerService = require("./loanLedgerService");
const { calculateLoan } = require("./loanCalculationService");
const { calculateFDMaturity } = require("./fixedDepositService");

/**
 * 1. Loan Ledger Report
 * Returns chronological payment history with principal/interest breakdown.
 */
const getLoanLedger = async (loanId) => {
  const loan = await Loan.findByPk(loanId);
  if (!loan) throw new Error("Loan not found");

  const transactions = await loanLedgerService.getLedger(loanId);

  const ledger = transactions.map((t) => ({
    date: t.transaction_date,
    type: t.transaction_type,
    withdrawal: parseFloat(t.withdrawal_amount),
    payment: parseFloat(t.deposit_amount),
    interest_charged: parseFloat(t.interest_charged),
    principal_paid: parseFloat(t.principal_paid),
    remaining_balance: parseFloat(t.remaining_balance),
    remarks: t.transaction_type,
  }));

  const lastTx = transactions[transactions.length - 1];
  const current_outstanding = lastTx ? parseFloat(lastTx.remaining_balance) : parseFloat(loan.loan_amount);

  return {
    loan_id: loanId,
    type: loan.interest_type,
    original_principal: parseFloat(loan.loan_amount),
    current_outstanding: current_outstanding,
    ledger,
  };
};

/**
 * 2. Outstanding Loan Report
 * Returns all active loans with their current outstanding balance.
 */
const getOutstandingLoans = async () => {
  const loans = await Loan.findAll({
    include: [{ association: "customer", attributes: ["name", "account_number"] }],
  });

  const report = await Promise.all(
    loans.map(async (loan) => {
      const calc = await calculateLoan(loan.loan_id);
      return {
        loan_id: loan.loan_id,
        customer_name: loan.customer?.name,
        account_number: loan.customer?.account_number,
        loan_amount: parseFloat(loan.loan_amount),
        interest_type: loan.interest_type,
        start_date: loan.loan_start_date,
        duration_months: loan.duration_months,
        total_paid: calc.total_paid,
        remaining_balance: calc.remaining_principal,
        interest_due: calc.interest_due,
      };
    })
  );

  // Filter out loans that are fully paid off
  return report.filter((r) => r.remaining_balance > 0 || r.interest_due > 0);
};

/**
 * 3. FD Maturity Report
 * Returns all FDs with their maturity date and amount.
 */
const getFdMaturityReport = async () => {
  const fds = await FixedDeposit.findAll({
    include: [{ association: "customer", attributes: ["name", "account_number"] }],
    order: [["start_date", "ASC"]],
  });

  // Calculate maturity for each
  return fds.map((fd) => {
    // The service has calculateFDMaturity which takes the FD data
    const maturity = calculateFDMaturity({
      deposit_amount: fd.deposit_amount,
      interest_rate: fd.interest_rate,
      interest_type: fd.interest_type,
      compounding_frequency: fd.compounding_frequency,
      start_date: fd.start_date,
      duration_months: fd.duration_months
    });

    return {
      fd_id: fd.fd_id,
      customer_name: fd.customer?.name,
      account_number: fd.customer?.account_number,
      deposit_amount: parseFloat(fd.deposit_amount),
      start_date: fd.start_date,
      duration_months: fd.duration_months,
      maturity_date: maturity.maturity_date,
      maturity_amount: maturity.maturity_amount,
      interest_earned: maturity.interest_earned,
    };
  });
};

/**
 * 4. Customer Loan Summary
 * Returns summary of all loans and FDs for a single customer.
 */
const getCustomerSummary = async (customerId) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) throw new Error("Customer not found");

  const loans = await Loan.findAll({ where: { customer_id: customerId } });
  const fds = await FixedDeposit.findAll({ where: { customer_id: customerId } });

  const loanSummaries = await Promise.all(
    loans.map(async (loan) => {
      const calc = await calculateLoan(loan.loan_id);
      return {
        loan_id: loan.loan_id,
        loan_amount: parseFloat(loan.loan_amount),
        remaining_balance: calc.remaining_principal,
        total_paid: calc.total_paid,
        interest_type: loan.interest_type,
        start_date: loan.loan_start_date,
      };
    })
  );

  const fdSummaries = fds.map(fd => {
    const mat = calculateFDMaturity(fd);
    return {
      fd_id: fd.fd_id,
      deposit_amount: parseFloat(fd.deposit_amount),
      maturity_amount: mat.maturity_amount,
      maturity_date: mat.maturity_date
    };
  });

  return {
    customer: {
      id: customer.customer_id,
      name: customer.name,
      account_number: customer.account_number,
    },
    loans: loanSummaries,
    fixedDeposits: fdSummaries
  };
};

module.exports = { getLoanLedger, getOutstandingLoans, getFdMaturityReport, getCustomerSummary };
