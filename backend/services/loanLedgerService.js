const { Loan, LoanTransaction, Payment, sequelize } = require("../models");

/**
 * Creates an initial loan disbursement transaction.
 */
const recordLoanDisbursement = async (loanId, amount, date, transaction) => {
  return await LoanTransaction.create(
    {
      loan_id: loanId,
      transaction_date: date,
      transaction_type: "LOAN_DISBURSEMENT",
      withdrawal_amount: amount,
      remaining_balance: amount,
    },
    { transaction }
  );
};

/**
 * Calculate simple interest based on precise days
 * interest = principal * rate * days / 365
 */
const calculateInterest = (principal, annualRate, days) => {
  const rateInDecimal = annualRate / 100;
  return (principal * rateInDecimal * days) / 365;
};

/**
 * Gets the last transaction for a loan.
 */
const getLastTransaction = async (loanId, transaction) => {
  return await LoanTransaction.findOne({
    where: { loan_id: loanId },
    order: [
      ["transaction_date", "DESC"],
      ["id", "DESC"],
    ],
    transaction,
  });
};

/**
 * Record a payment, allocate to interest first, then principal.
 */
const calculateDailyReducingInterest = async (loan, paymentAmount, paymentDate, transaction) => {
  const lastTx = await getLastTransaction(loan.loan_id, transaction);
  if (!lastTx) throw new Error("No previous transactions found to apply payment");

  const lastDate = new Date(lastTx.transaction_date);
  const currentReqDate = new Date(paymentDate);

  const diffTime = Math.abs(currentReqDate - lastDate);
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let currentBalance = parseFloat(lastTx.remaining_balance);
  let interestGenerated = 0;

  if (days > 0 && currentBalance > 0) {
    interestGenerated = calculateInterest(currentBalance, parseFloat(loan.interest_rate), days);
    currentBalance += interestGenerated;
      
    await LoanTransaction.create(
      {
        loan_id: loan.loan_id,
        transaction_date: paymentDate,
        transaction_type: "INTEREST_ENTRY",
        interest_charged: parseFloat(interestGenerated.toFixed(2)),
        remaining_balance: parseFloat(currentBalance.toFixed(2)),
      },
      { transaction }
    );
  }

  let interestPaid = 0;
  let principalPaid = 0;
  let remainingPayment = parseFloat(paymentAmount);

  if (remainingPayment >= interestGenerated) {
    interestPaid = interestGenerated;
    remainingPayment -= interestGenerated;
  } else {
    interestPaid = remainingPayment;
    remainingPayment = 0;
  }

  principalPaid = remainingPayment;
  currentBalance -= parseFloat(paymentAmount);

  return await LoanTransaction.create(
    {
      loan_id: loan.loan_id,
      transaction_date: paymentDate,
      transaction_type: "PAYMENT",
      deposit_amount: parseFloat(paymentAmount),
      interest_charged: parseFloat(interestPaid.toFixed(2)),
      principal_paid: parseFloat(principalPaid.toFixed(2)),
      remaining_balance: parseFloat(currentBalance.toFixed(2)),
    },
    { transaction }
  );
};

const processPayment = async (loanId, paymentAmount, paymentDate, transaction) => {
  const loan = await Loan.findByPk(loanId, { transaction });
  if (!loan) throw new Error("Loan not found");

  const lastTx = await getLastTransaction(loanId, transaction);
  if (!lastTx) throw new Error("No previous transactions found to apply payment");

  const lastDate = new Date(lastTx.transaction_date);
  const currentReqDate = new Date(paymentDate);

  if (currentReqDate < lastDate) {
    throw new Error("Payment date cannot be before the last transaction date");
  }

  let currentBalance = parseFloat(lastTx.remaining_balance);

  // Apply new daily reducing balance rules ONLY if the loan is configured for it
  // Existing functionality handles general daily interest fallback if applicable, 
  // but to preserve explicit backward compatibility we explicitly check here.
  if (loan.calculation_type === 'ANNUAL_DAILY_REDUCING') {
    return await calculateDailyReducingInterest(loan, paymentAmount, paymentDate, transaction);
  } else {
    // BACKWARD COMPATIBILITY
    // Existing loans calculate interest on the fly and put payment mostly toward principal
    const diffTime = Math.abs(currentReqDate - lastDate);
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let interestGenerated = 0;

    if (days > 0 && currentBalance > 0) {
      interestGenerated = calculateInterest(currentBalance, parseFloat(loan.interest_rate), days);
      currentBalance += interestGenerated;
      await LoanTransaction.create(
        {
          loan_id: loanId,
          transaction_date: paymentDate,
          transaction_type: "INTEREST_ENTRY",
          interest_charged: parseFloat(interestGenerated.toFixed(2)),
          remaining_balance: parseFloat(currentBalance.toFixed(2)),
        },
        { transaction }
      );
    }

    let interestPaid = 0;
    let principalPaid = 0;
    let remainingPayment = parseFloat(paymentAmount);

    if (remainingPayment >= interestGenerated) {
      interestPaid = interestGenerated;
      remainingPayment -= interestGenerated;
    } else {
      interestPaid = remainingPayment;
      remainingPayment = 0;
    }

    principalPaid = remainingPayment;
    currentBalance -= parseFloat(paymentAmount);

    return await LoanTransaction.create(
      {
        loan_id: loanId,
        transaction_date: paymentDate,
        transaction_type: "PAYMENT",
        deposit_amount: parseFloat(paymentAmount),
        interest_charged: 0,
        principal_paid: parseFloat(principalPaid.toFixed(2)),
        remaining_balance: parseFloat(currentBalance.toFixed(2)),
      },
      { transaction }
    );
  }
};

/**
 * Record additional withdrawal
 */
const recordWithdrawal = async (loanId, amount, date, transaction) => {
  const lastTx = await getLastTransaction(loanId, transaction);
  if (!lastTx) throw new Error("No previous transactions. Initial disbursement must happen first.");
  
  const currentBalance = parseFloat(lastTx.remaining_balance) + parseFloat(amount);
  
  return await LoanTransaction.create(
    {
      loan_id: loanId,
      transaction_date: date,
      transaction_type: "WITHDRAWAL",
      withdrawal_amount: amount,
      remaining_balance: currentBalance,
    },
    { transaction }
  );
};

const getLedger = async (loanId) => {
  return await LoanTransaction.findAll({
    where: { loan_id: loanId },
    order: [
      ["transaction_date", "ASC"],
      ["id", "ASC"],
    ],
  });
};

module.exports = {
  recordLoanDisbursement,
  processPayment,
  recordWithdrawal,
  getLedger,
};