const { Loan, Payment } = require("../models");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Days between two Date objects */
const daysBetween = (d1, d2) => {
  const ms = new Date(d2) - new Date(d1);
  return Math.max(Math.round(ms / (1000 * 60 * 60 * 24)), 0);
};

// ─────────────────────────────────────────────
// 1. Simple Interest
// ─────────────────────────────────────────────

/**
 * SI = P × R × T / 100
 * where T is in years.
 * For monthly calculation_type we derive T from duration_months.
 * For daily calculation_type we derive T from actual days.
 */
const calculateSimpleInterest = (loan, payments, asOfDate) => {
  const principal = parseFloat(loan.loan_amount);
  const rate = parseFloat(loan.interest_rate);
  const startDate = new Date(loan.loan_start_date);
  const currentDate = new Date(asOfDate);

  let timeYears;
  if (loan.calculation_type === "daily") {
    const days = daysBetween(startDate, currentDate);
    timeYears = days / 365;
  } else {
    // monthly — use duration_months
    timeYears = loan.duration_months / 12;
  }

  const totalInterest = parseFloat((principal * rate * timeYears / 100).toFixed(2));
  const totalPayable = parseFloat((principal + totalInterest).toFixed(2));

  const totalPaid = payments.reduce(
    (sum, p) => sum + parseFloat(p.payment_amount),
    0
  );

  const remainingPrincipal = principal; // simple interest doesn't reduce principal mid-term
  const interestDue = parseFloat(totalInterest.toFixed(2));
  const balanceDue = parseFloat((totalPayable - totalPaid).toFixed(2));

  const paymentBreakdown = payments.map((p) => ({
    payment_id: p.payment_id,
    payment_date: p.payment_date,
    amount: parseFloat(p.payment_amount),
    remarks: p.remarks,
  }));

  return {
    type: "simple",
    principal,
    rate,
    duration_months: loan.duration_months,
    total_interest: totalInterest,
    total_payable: totalPayable,
    total_paid: parseFloat(totalPaid.toFixed(2)),
    balance_due: balanceDue,
    remaining_principal: remainingPrincipal,
    interest_due: interestDue,
    payment_breakdown: paymentBreakdown,
  };
};

// ─────────────────────────────────────────────
// 2. Compound Interest
// ─────────────────────────────────────────────

/**
 * CI = P × (1 + r/n)^(n×t) − P
 * n = compounding frequency (12 for monthly, 365 for daily)
 */
const calculateCompoundInterest = (loan, payments, asOfDate) => {
  const principal = parseFloat(loan.loan_amount);
  const rate = parseFloat(loan.interest_rate);
  const startDate = new Date(loan.loan_start_date);
  const currentDate = new Date(asOfDate);

  let n, t;
  if (loan.calculation_type === "daily") {
    n = 365;
    t = daysBetween(startDate, currentDate) / 365;
  } else {
    n = 12;
    t = loan.duration_months / 12;
  }

  const amount = principal * Math.pow(1 + rate / (100 * n), n * t);
  const totalInterest = parseFloat((amount - principal).toFixed(2));
  const totalPayable = parseFloat(amount.toFixed(2));

  const totalPaid = payments.reduce(
    (sum, p) => sum + parseFloat(p.payment_amount),
    0
  );

  const balanceDue = parseFloat((totalPayable - totalPaid).toFixed(2));

  const paymentBreakdown = payments.map((p) => ({
    payment_id: p.payment_id,
    payment_date: p.payment_date,
    amount: parseFloat(p.payment_amount),
    remarks: p.remarks,
  }));

  return {
    type: "compound",
    principal,
    rate,
    duration_months: loan.duration_months,
    compounding: loan.calculation_type === "daily" ? "daily" : "monthly",
    total_interest: totalInterest,
    total_payable: totalPayable,
    total_paid: parseFloat(totalPaid.toFixed(2)),
    balance_due: balanceDue,
    remaining_principal: principal,
    interest_due: totalInterest,
    payment_breakdown: paymentBreakdown,
  };
};

// ─────────────────────────────────────────────
// 3. Reducing Balance
// ─────────────────────────────────────────────

/**
 * Interest from last payment date → current date:
 *   interest = outstanding_principal × rate/100 × days / 365
 *
 * Payment allocation:
 *   1. Clears accrued interest first
 *   2. Remaining amount reduces outstanding principal
 */
const calculateReducingBalance = (loan, payments, asOfDate) => {
  const originalPrincipal = parseFloat(loan.loan_amount);
  const rate = parseFloat(loan.interest_rate);
  const startDate = new Date(loan.loan_start_date);
  const currentDate = new Date(asOfDate);

  // Sort payments chronologically (earliest first)
  const sorted = [...payments].sort(
    (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
  );

  let outstandingPrincipal = originalPrincipal;
  let lastDate = startDate;
  let totalInterestAccrued = 0;
  let totalPaid = 0;

  const paymentBreakdown = [];

  for (const p of sorted) {
    const paymentDate = new Date(p.payment_date);
    const days = daysBetween(lastDate, paymentDate);

    // Accrue interest from last date to this payment date
    const interest = parseFloat(
      (outstandingPrincipal * (rate / 100) * days / 365).toFixed(2)
    );
    totalInterestAccrued += interest;

    const paymentAmount = parseFloat(p.payment_amount);
    totalPaid += paymentAmount;

    // Allocation: interest first, then principal
    let interestPortion, principalPortion;
    if (paymentAmount >= interest) {
      interestPortion = interest;
      principalPortion = parseFloat((paymentAmount - interest).toFixed(2));
    } else {
      interestPortion = paymentAmount;
      principalPortion = 0;
    }

    outstandingPrincipal = parseFloat(
      (outstandingPrincipal - principalPortion).toFixed(2)
    );
    if (outstandingPrincipal < 0) outstandingPrincipal = 0;

    paymentBreakdown.push({
      payment_id: p.payment_id,
      payment_date: p.payment_date,
      amount: paymentAmount,
      days_since_last: days,
      interest_accrued: interest,
      interest_portion: interestPortion,
      principal_portion: principalPortion,
      outstanding_principal_after: outstandingPrincipal,
      remarks: p.remarks,
    });

    lastDate = paymentDate;
  }

  // Interest accrued from last payment (or start) to asOfDate
  const remainingDays = daysBetween(lastDate, currentDate);
  const currentInterestDue = parseFloat(
    (outstandingPrincipal * (rate / 100) * remainingDays / 365).toFixed(2)
  );
  totalInterestAccrued = parseFloat(
    (totalInterestAccrued + currentInterestDue).toFixed(2)
  );

  const totalPayable = parseFloat(
    (outstandingPrincipal + currentInterestDue).toFixed(2)
  );

  return {
    type: "reducing_balance",
    original_principal: originalPrincipal,
    rate,
    duration_months: loan.duration_months,
    remaining_principal: outstandingPrincipal,
    interest_due: currentInterestDue,
    days_since_last_payment: remainingDays,
    total_interest_accrued: totalInterestAccrued,
    total_payable: totalPayable,
    total_paid: parseFloat(totalPaid.toFixed(2)),
    payment_breakdown: paymentBreakdown,
  };
};

// ─────────────────────────────────────────────
// 4. Annual Rate Monthly Reducing
// ─────────────────────────────────────────────

const calculateAnnualMonthlyReducing = (loan, payments, asOfDate) => {
  const originalPrincipal = parseFloat(loan.loan_amount);
  const annualRate = parseFloat(loan.interest_rate);
  const monthlyRate = annualRate / 12 / 100;
  
  const startDate = new Date(loan.loan_start_date);
  const currentDate = new Date(asOfDate);

  const sorted = [...payments].sort(
    (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
  );

  let outstandingPrincipal = originalPrincipal;
  let lastDate = startDate;
  let totalInterestAccrued = 0;
  let totalPaid = 0;

  const paymentBreakdown = [];

  for (const p of sorted) {
    const paymentDate = new Date(p.payment_date);
    
    // number of months from lastDate to paymentDate
    let months = (paymentDate.getFullYear() - lastDate.getFullYear()) * 12 + (paymentDate.getMonth() - lastDate.getMonth());
    if (months < 0) months = 0;

    // interest = principal * monthly_rate * months
    const interest = parseFloat(
      (outstandingPrincipal * monthlyRate * months).toFixed(2)
    );
    totalInterestAccrued += interest;

    const paymentAmount = parseFloat(p.payment_amount);
    totalPaid += paymentAmount;

    let interestPortion, principalPortion;
    if (paymentAmount >= interest) {
      interestPortion = interest;
      principalPortion = parseFloat((paymentAmount - interest).toFixed(2));
    } else {
      interestPortion = paymentAmount;
      principalPortion = 0;
    }

    outstandingPrincipal = parseFloat(
      (outstandingPrincipal - principalPortion).toFixed(2)
    );
    if (outstandingPrincipal < 0) outstandingPrincipal = 0;

    paymentBreakdown.push({
      payment_id: p.payment_id,
      payment_date: p.payment_date,
      amount: paymentAmount,
      months_since_last: months,
      interest_accrued: interest,
      interest_portion: interestPortion,
      principal_portion: principalPortion,
      outstanding_principal_after: outstandingPrincipal,
      remarks: p.remarks,
    });

    if (months > 0) {
      lastDate = paymentDate; // advance lastDate by the exact months accounted for
      // To strictly match "from last calculation month to payment month", we might just set lastDate to paymentDate
    }
  }

  // interest accrued from last payment month to asOfDate month
  let remainingMonths = (currentDate.getFullYear() - lastDate.getFullYear()) * 12 + (currentDate.getMonth() - lastDate.getMonth());
  if (remainingMonths < 0) remainingMonths = 0;

  const currentInterestDue = parseFloat(
    (outstandingPrincipal * monthlyRate * remainingMonths).toFixed(2)
  );
  totalInterestAccrued = parseFloat(
    (totalInterestAccrued + currentInterestDue).toFixed(2)
  );

  const totalPayable = parseFloat(
    (outstandingPrincipal + currentInterestDue).toFixed(2)
  );

  return {
    type: "annual_monthly_reducing",
    original_principal: originalPrincipal,
    rate: annualRate,
    duration_months: loan.duration_months,
    remaining_principal: outstandingPrincipal,
    interest_due: currentInterestDue,
    months_since_last_payment: remainingMonths,
    total_interest_accrued: totalInterestAccrued,
    total_payable: totalPayable,
    total_paid: parseFloat(totalPaid.toFixed(2)),
    payment_breakdown: paymentBreakdown,
  };
};

// ─────────────────────────────────────────────
// 5. Annual Rate Daily Reducing
// ─────────────────────────────────────────────

const calculateDailyReducingInterest = (loan, payments, asOfDate) => {
  const originalPrincipal = parseFloat(loan.loan_amount);
  const annualRate = parseFloat(loan.interest_rate) / 100;
  
  const startDate = new Date(loan.loan_start_date);
  const currentDate = new Date(asOfDate);

  const sorted = [...payments].sort(
    (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
  );

  let outstandingPrincipal = originalPrincipal;
  let lastDate = startDate;
  let totalInterestAccrued = 0;
  let totalPaid = 0;

  const paymentBreakdown = [];

  for (const p of sorted) {
    const paymentDate = new Date(p.payment_date);
    
    // number of days from lastDate to paymentDate
    const days = daysBetween(lastDate, paymentDate);

    // interest = principal * annual_rate * days / 365
    const interest = parseFloat(
      (outstandingPrincipal * annualRate * days / 365).toFixed(2)
    );
    totalInterestAccrued += interest;

    const paymentAmount = parseFloat(p.payment_amount);
    totalPaid += paymentAmount;

    let interestPortion, principalPortion;
    if (paymentAmount >= interest) {
      interestPortion = interest;
      principalPortion = parseFloat((paymentAmount - interest).toFixed(2));
    } else {
      interestPortion = paymentAmount;
      principalPortion = 0;
    }

    outstandingPrincipal = parseFloat(
      (outstandingPrincipal - principalPortion).toFixed(2)
    );
    if (outstandingPrincipal < 0) outstandingPrincipal = 0;

    paymentBreakdown.push({
      payment_id: p.payment_id,
      payment_date: p.payment_date,
      amount: paymentAmount,
      days_since_last: days,
      interest_accrued: interest,
      interest_portion: interestPortion,
      principal_portion: principalPortion,
      outstanding_principal_after: outstandingPrincipal,
      remarks: p.remarks,
    });

    if (days > 0) {
      lastDate = paymentDate;
    }
  }

  // interest accrued from last payment day to asOfDate
  const remainingDays = daysBetween(lastDate, currentDate);
  const currentInterestDue = parseFloat(
    (outstandingPrincipal * annualRate * remainingDays / 365).toFixed(2)
  );
  totalInterestAccrued = parseFloat(
    (totalInterestAccrued + currentInterestDue).toFixed(2)
  );

  const totalPayable = parseFloat(
    (outstandingPrincipal + currentInterestDue).toFixed(2)
  );

  return {
    type: "annual_daily_reducing",
    original_principal: originalPrincipal,
    rate: loan.interest_rate,
    duration_months: loan.duration_months,
    remaining_principal: outstandingPrincipal,
    interest_due: currentInterestDue,
    days_since_last_payment: remainingDays,
    total_interest_accrued: totalInterestAccrued,
    total_payable: totalPayable,
    total_paid: parseFloat(totalPaid.toFixed(2)),
    payment_breakdown: paymentBreakdown,
  };
};

// ─────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────

/**
 * Calculate loan statement for a given loan ID.
 * @param {number} loanId
 * @param {string|Date} [asOfDate] – defaults to today
 */
const calculateLoan = async (loanId, asOfDate) => {
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

  const date = asOfDate || new Date();

  switch (loan.interest_type) {
    case "simple":
      if (loan.calculation_type === "ANNUAL_DAILY_REDUCING") {
        return calculateDailyReducingInterest(loan, payments, date);
      }
      if (loan.calculation_type === "ANNUAL_MONTHLY_REDUCING") {
        return calculateAnnualMonthlyReducing(loan, payments, date);
      }
      return calculateSimpleInterest(loan, payments, date);

    case "compound":
      if (loan.calculation_type === "ANNUAL_DAILY_REDUCING") {
        return calculateDailyReducingInterest(loan, payments, date);
      }
      if (loan.calculation_type === "ANNUAL_MONTHLY_REDUCING") {
        return calculateAnnualMonthlyReducing(loan, payments, date);
      }
      return calculateCompoundInterest(loan, payments, date);

    case "reducing":
      if (loan.calculation_type === "ANNUAL_DAILY_REDUCING") {
        return calculateDailyReducingInterest(loan, payments, date);
      }
      if (loan.calculation_type === "ANNUAL_MONTHLY_REDUCING") {
        return calculateAnnualMonthlyReducing(loan, payments, date);
      }
      return calculateReducingBalance(loan, payments, date);

    default: {
      const error = new Error(
        `Unknown interest type: "${loan.interest_type}".`
      );
      error.statusCode = 400;
      throw error;
    }
  }
};

module.exports = { calculateLoan };
