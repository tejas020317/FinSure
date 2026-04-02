const express = require("express");
const router = express.Router();
const { create, getAll, getOne, remove, getLedger, addWithdrawal } = require("../controllers/loanController");
const { getLoanCalculation } = require("../controllers/loanCalculationController");

// POST   /api/loans
router.post("/", create);

// GET    /api/loans
router.get("/", getAll);

// GET    /api/loans/:id/ledger (Loan Statement Ledger)
router.get("/:id/ledger", getLedger);

// POST   /api/loans/:id/withdrawals (Partial Loans)
router.post("/:id/withdrawals", addWithdrawal);

// GET    /api/loans/:id/calculation  — loan statement / interest calculation
router.get("/:id/calculation", getLoanCalculation);

// GET    /api/loans/:id
router.get("/:id", getOne);

// DELETE /api/loans/:id
router.delete("/:id", remove);

module.exports = router;
