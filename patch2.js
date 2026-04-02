const fs = require('fs');
let code = fs.readFileSync('backend/services/loanLedgerService.js', 'utf8');

const parts = code.split('/**\n * Record additional withdrawal\n */');
if(parts.length === 2){
  const beforeWithdrawal = parts[0];
  const keepTop = beforeWithdrawal.split('/**\n * Record a payment, allocate to interest first, then principal.\n */')[0];
  
  const newProcessPayment = `/**
 * Record a payment, allocate to interest first, then principal.
 */
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

  if (loan.calculation_type === 'ANNUAL_DAILY_REDUCING') {
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
          interest_charged: interestGenerated,
          remaining_balance: currentBalance,
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

    const newTx = await LoanTransaction.create(
      {
        loan_id: loanId,
        transaction_date: paymentDate,
        transaction_type: "PAYMENT",
        deposit_amount: paymentAmount,
        interest_charged: interestPaid,
        principal_paid: principalPaid,
        remaining_balance: currentBalance,
      },
      { transaction }
    );
    return newTx;
  } else {
    // For other calculation types, standard behavior
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
          interest_charged: interestGenerated,
          remaining_balance: currentBalance,
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
        deposit_amount: paymentAmount,
        interest_charged: 0,
        principal_paid: principalPaid,
        remaining_balance: currentBalance,
      },
      { transaction }
    );
  }
};

`;
  
  const finalCode = keepTop + newProcessPayment + '/**\n * Record additional withdrawal\n */' + parts[1];
  fs.writeFileSync('backend/services/loanLedgerService.js', finalCode);
  console.log("Patched successfully");
} else {
  // Try CRLF
  const partsCRLF = code.split('/**\\r\\n * Record additional withdrawal\\r\\n */');
  if(partsCRLF.length === 2) {
      // same logic but with CRLF .. handle properly by regex
  }
  console.log("Could not split");
}
