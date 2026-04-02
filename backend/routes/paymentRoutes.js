const express = require("express");
const router = express.Router();
const { create, getByLoan, remove } = require("../controllers/paymentController");

// POST   /api/payments
router.post("/", create);

// GET    /api/payments/:loan_id  — payment history for a loan
router.get("/:loan_id", getByLoan);

// DELETE /api/payments/:id
router.delete("/:id", remove);

module.exports = router;
