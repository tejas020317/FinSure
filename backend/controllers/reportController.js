const reportService = require("../services/reportService");
const pdfService = require("../services/pdfService");

/** GET /api/reports/loan-ledger/:loan_id */
const loanLedger = async (req, res) => {
  try {
    const data = await reportService.getLoanLedger(req.params.loan_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message }); 
  }
};

/** GET /api/reports/outstanding-loans */
const outstandingLoans = async (_req, res) => {
  try {
    const data = await reportService.getOutstandingLoans();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });    
  }
};

/** GET /api/reports/fd-maturity */
const fdMaturity = async (_req, res) => {
  try {
    const data = await reportService.getFdMaturityReport();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });    
  }
};

/** GET /api/reports/loan-ledger/:loan_id/pdf */
const downloadLoanLedgerPDF = async (req, res) => {
  try {
    await pdfService.generateLoanLedgerPDF(req.params.loan_id, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/reports/loan-ledger/:loan_id/csv */
const downloadLoanLedgerCSV = async (req, res) => {
  try {
    const data = await reportService.getLoanLedger(req.params.loan_id);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="loan_ledger_${req.params.loan_id}.csv"`);
    
    let csv = "Date,Deposit,Interest,Principal,Withdrawal,Balance,Remarks\n";
    data.ledger.forEach(row => {
      csv += `${row.date},${row.payment},${row.interest_charged},${row.principal_paid},${row.withdrawal},${row.remaining_balance},${row.type}\n`;
    });
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/reports/fd-maturity/pdf */
const downloadFDMaturityPDF = async (req, res) => {
  try {
    await pdfService.generateFDMaturityPDF(res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/reports/customer-summary/:customer_id/pdf */
const downloadCustomerSummaryPDF = async (req, res) => {
  try {
    await pdfService.generateCustomerSummaryPDF(req.params.customer_id, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  loanLedger, 
  outstandingLoans, 
  fdMaturity,
  downloadLoanLedgerPDF,
  downloadLoanLedgerCSV,
  downloadFDMaturityPDF,
  downloadCustomerSummaryPDF
};
