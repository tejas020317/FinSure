const PDFDocument = require("pdfkit");
const { getLoanLedger, getFdMaturityReport, getCustomerSummary } = require("./reportService");

const generateLoanLedgerPDF = async (loanId, res) => {
  const data = await getLoanLedger(loanId);
  const doc = new PDFDocument({ margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="loan_ledger_${loanId}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text(`Loan Ledger Report - Loan #${data.loan_id}`, { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Type: ${data.type}`);
  doc.text(`Original Principal: \u20B9${data.original_principal}`);
  doc.text(`Current Outstanding: \u20B9${data.current_outstanding}`);
  doc.moveDown();

  // Table Header
  const startX = 30;
  let currentY = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Date", startX, currentY);
  doc.text("Deposit", startX + 90, currentY);
  doc.text("Interest", startX + 170, currentY);
  doc.text("Principal", startX + 250, currentY);
  doc.text("Withdrawal", startX + 330, currentY);
  doc.text("Balance", startX + 410, currentY);
  doc.text("Remarks", startX + 480, currentY);
  
  doc.moveTo(startX, currentY + 15).lineTo(580, currentY + 15).stroke();
  currentY += 20;

  doc.font("Helvetica");
  data.ledger.forEach((row) => {
    if (currentY > 750) {
      doc.addPage();
      currentY = 30;
    }
    doc.text(new Date(row.date).toLocaleDateString(), startX, currentY);
    doc.text(`\u20B9${row.payment}`, startX + 90, currentY);
    doc.text(`\u20B9${row.interest_charged}`, startX + 170, currentY);
    doc.text(`\u20B9${row.principal_paid}`, startX + 250, currentY);
    doc.text(`\u20B9${row.withdrawal}`, startX + 330, currentY);
    doc.text(`\u20B9${row.remaining_balance}`, startX + 410, currentY);
    doc.text(row.type || "-", startX + 480, currentY, { width: 100, height: 15, lineBreak: false });
    currentY += 15;
  });

  doc.end();
};

const generateFDMaturityPDF = async (res) => {
  const data = await getFdMaturityReport();
  const doc = new PDFDocument({ margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="fd_maturity_report.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text("FD Maturity Report", { align: "center" });
  doc.moveDown(2);

  const startX = 30;
  let currentY = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("ID", startX, currentY);
  doc.text("Customer", startX + 40, currentY);
  doc.text("A/C No", startX + 160, currentY);
  doc.text("Deposit", startX + 260, currentY);
  doc.text("Maturity Date", startX + 360, currentY);
  doc.text("Matured Amt", startX + 470, currentY);
  
  doc.moveTo(startX, currentY + 15).lineTo(580, currentY + 15).stroke();
  currentY += 20;

  doc.font("Helvetica");
  data.forEach((row) => {
    if (currentY > 750) {
      doc.addPage();
      currentY = 30;
    }
    doc.text(`#${row.fd_id}`, startX, currentY);
    doc.text(row.customer_name || "N/A", startX + 40, currentY, { width: 110, height: 15, lineBreak: false });
    doc.text(row.account_number || "N/A", startX + 160, currentY);
    doc.text(`\u20B9${row.deposit_amount}`, startX + 260, currentY);
    doc.text(new Date(row.maturity_date).toLocaleDateString(), startX + 360, currentY);
    doc.text(`\u20B9${row.maturity_amount}`, startX + 470, currentY);
    currentY += 20;
  });

  doc.end();
};

const generateCustomerSummaryPDF = async (customerId, res) => {
  const data = await getCustomerSummary(customerId);
  const doc = new PDFDocument({ margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="customer_${customerId}_summary.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text("Customer Summary Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).font("Helvetica-Bold").text("Customer Details");
  doc.font("Helvetica").text(`Name: ${data.customer.name}`);
  doc.text(`A/C Number: ${data.customer.account_number}`);
  doc.moveDown();

  doc.fontSize(12).font("Helvetica-Bold").text("Loans");
  doc.moveDown(0.5);
  doc.fontSize(10);
  if (data.loans.length === 0) {
    doc.font("Helvetica").text("No loans found.");
  } else {
    data.loans.forEach(loan => {
      doc.font("Helvetica-Bold").text(`Loan #${loan.loan_id}`);
      doc.font("Helvetica").text(`Start Date: ${new Date(loan.start_date).toLocaleDateString()}`);
      doc.text(`Loan Amount: \u20B9${loan.loan_amount} | Total Paid: \u20B9${loan.total_paid}`);
      doc.text(`Remaining Balance: \u20B9${loan.remaining_balance}`);
      doc.moveDown(0.5);
    });
  }
  doc.moveDown();

  doc.fontSize(12).font("Helvetica-Bold").text("Fixed Deposits");
  doc.moveDown(0.5);
  doc.fontSize(10);
  if (data.fixedDeposits.length === 0) {
    doc.font("Helvetica").text("No fixed deposits found.");
  } else {
    data.fixedDeposits.forEach(fd => {
      doc.font("Helvetica-Bold").text(`FD #${fd.fd_id}`);
      doc.font("Helvetica").text(`Deposit Amount: \u20B9${fd.deposit_amount}`);
      doc.text(`Maturity Date: ${new Date(fd.maturity_date).toLocaleDateString()} | Maturity Amount: \u20B9${fd.maturity_amount}`);
      doc.moveDown(0.5);
    });
  }

  doc.end();
};

module.exports = {
  generateLoanLedgerPDF,
  generateFDMaturityPDF,
  generateCustomerSummaryPDF
};