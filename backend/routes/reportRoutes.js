const express = require("express");
const router = express.Router();
const { 
  loanLedger, 
  outstandingLoans, 
  fdMaturity,
  downloadLoanLedgerPDF,
  downloadLoanLedgerCSV,
  downloadFDMaturityPDF,
  downloadCustomerSummaryPDF
} = require("../controllers/reportController");

router.get("/loan-ledger/:loan_id", loanLedger);
router.get("/outstanding-loans", outstandingLoans);
router.get("/fd-maturity", fdMaturity);

// PDF endpoints
router.get("/loan-ledger/:loan_id/pdf", downloadLoanLedgerPDF);
router.get("/loan-ledger/:loan_id/csv", downloadLoanLedgerCSV);
router.get("/fd-maturity/pdf", downloadFDMaturityPDF);
router.get("/customer-summary/:customer_id/pdf", downloadCustomerSummaryPDF);

module.exports = router;
