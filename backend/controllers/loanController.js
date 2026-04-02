const loanService = require("../services/loanService");
const loanLedgerService = require("../services/loanLedgerService");
const { AuditLog, sequelize } = require("../models");

/** POST /api/loans */
const create = async (req, res) => {
  try {
    const {
      customer_id,
      loan_amount,
      interest_rate,
      interest_type,
      calculation_type,
      loan_start_date,
      duration_months,
    } = req.body;

    if (!customer_id || !loan_amount || !interest_rate || !loan_start_date || !duration_months) {
      return res.status(400).json({
        success: false,
        message: "customer_id, loan_amount, interest_rate, loan_start_date, and duration_months are required.",
      });
    }

    const loan = await loanService.createLoan({
      customer_id,
      loan_amount,
      interest_rate,
      interest_type,
      calculation_type,
      loan_start_date,
      duration_months,
    });

    if (req.user && req.user.id) {
      await AuditLog.create({
        user_id: req.user.id,
        action: "create",
        entity_type: "loan",
        entity_id: loan.loan_id,
      }).catch(console.error);
    }

    return res.status(201).json({ success: true, data: loan });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** GET /api/loans */
const getAll = async (_req, res) => {
  try {
    const loans = await loanService.getAllLoans();
    return res.status(200).json({ success: true, data: loans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/loans/:id */
const getOne = async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    return res.status(200).json({ success: true, data: loan });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** DELETE /api/loans/:id */
const remove = async (req, res) => {
  try {
    const result = await loanService.deleteLoan(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** GET /api/loans/:id/ledger */
const getLedger = async (req, res) => {
  try {
    const ledger = await loanLedgerService.getLedger(req.params.id);
    return res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** POST /api/loans/:id/withdrawals */
const addWithdrawal = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { amount, date } = req.body;
    if (!amount || !date) {
      throw { statusCode: 400, message: "amount and date are required" };
    }
    const withdrawal = await loanLedgerService.recordWithdrawal(req.params.id, amount, date, transaction);
    await transaction.commit();
    return res.status(201).json({ success: true, data: withdrawal });
  } catch (error) {
    await transaction.rollback();
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { create, getAll, getOne, remove, getLedger, addWithdrawal };
