const { sequelize, Customer, Loan, Payment, FixedDeposit } = require("../models");
const { Op } = require("sequelize");
const { calculateLoan } = require("./loanCalculationService");

/**
 * Aggregate dashboard summary statistics.
 */
const getDashboardStats = async () => {
  // Today's date boundaries (UTC-safe)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalCustomers,
    activeLoans,
    totalFdAccounts,
    outstandingResult,
    paymentsToday,
  ] = await Promise.all([
    // 1. Total customers
    Customer.count(),

    // 2. Active loans (all loans — no status field yet, so count all)
    Loan.count(),

    // 3. Total FD accounts
    FixedDeposit.count(),

    // 4. Sum of loan principal still outstanding
    Loan.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("loan_amount")), "total_loan_amount"],
      ],
      raw: true,
    }),

    // 5. Count of payments made today
    Payment.count({
      where: {
        payment_date: {
          [Op.between]: [
            todayStart.toISOString().split("T")[0],
            todayEnd.toISOString().split("T")[0],
          ],
        },
      },
    }),
  ]);

  const totalOutstandingLoans = parseFloat(
    outstandingResult[0]?.total_loan_amount ?? 0
  ).toFixed(2);

  return {
    total_customers: totalCustomers,
    active_loans: activeLoans,
    total_fd_accounts: totalFdAccounts,
    total_outstanding_loans: parseFloat(totalOutstandingLoans),
    payments_today: paymentsToday,
  };
};

/**
 * Generate dashboard chart data.
 */
const getDashboardCharts = async () => {
  const loansRaw = await Loan.findAll({ raw: true });
  const fdsRaw = await FixedDeposit.findAll({ raw: true });
  const paymentsRaw = await Payment.findAll({ raw: true });

  let totalInterest = 0;
  let totalPrincipal = 0;
  const loans = await Loan.findAll();
  
  for (const l of loans) {
    try {
      const calc = await calculateLoan(l.loan_id);
      if (calc && calc.payment_breakdown) {
        for (const p of calc.payment_breakdown) {
          totalInterest += (p.interest_portion || 0);
          totalPrincipal += (p.principal_portion || 0);
        }
      }
    } catch (e) {
      // Ignore calculation errors for broken loans
    }
  }

  const interestVsPrincipal = [
    { name: "Principal Paid", value: parseFloat(totalPrincipal.toFixed(2)), fill: "#3b82f6" },
    { name: "Interest Paid", value: parseFloat(totalInterest.toFixed(2)), fill: "#f59e0b" }
  ];

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1); d.setHours(0,0,0,0);
    months.push(d);
  }

  const timeSeriesData = months.map(d => {
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    
    // Loan balance
    const loansUpTo = loansRaw.filter(l => new Date(l.loan_start_date) <= endOfMonth)
                           .reduce((sum, l) => sum + parseFloat(l.loan_amount), 0);
    const paymentsUpTo = paymentsRaw.filter(p => new Date(p.payment_date) <= endOfMonth)
                                 .reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);
    
    // FD Growth
    const fdUpTo = fdsRaw.filter(f => new Date(f.start_date) <= endOfMonth)
                      .reduce((sum, f) => sum + parseFloat(f.deposit_amount), 0);

    return {
      name: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      loanBalance: parseFloat(Math.max(0, loansUpTo - paymentsUpTo).toFixed(2)),
      fdGrowth: parseFloat(fdUpTo.toFixed(2))
    };
  });

  return {
    interestVsPrincipal,
    timeSeriesData
  };
};

module.exports = { getDashboardStats, getDashboardCharts };
