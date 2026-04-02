const fs = require('fs');
let code = fs.readFileSync('backend/services/loanLedgerService.js', 'utf8');

const regex = /if \(loan\.calculation_type === 'ANNUAL_DAILY_REDUCING'\) {[\s\S]*?return await LoanTransaction\.create\([\s\S]*?\} else {/;

const replacement = `if (loan.calculation_type === 'ANNUAL_DAILY_REDUCING') {
    return await calculateDailyReducingInterest(loan, paymentAmount, paymentDate, transaction);
  } else {`;

code = code.replace(regex, replacement);

const fnIndex = code.indexOf('const processPayment');

const newFn = `const calculateDailyReducingInterest = async (loan, paymentAmount, paymentDate, transaction) => {
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

`;

code = code.slice(0, fnIndex) + newFn + code.slice(fnIndex);
fs.writeFileSync('backend/services/loanLedgerService.js', code);
