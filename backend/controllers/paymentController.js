const paymentService = require("../services/paymentService");
const { AuditLog } = require("../models");

/** POST /api/payments */
const create = async (req, res) => {
  try {
    const { loan_id, payment_amount, payment_date, remarks } = req.body;

    if (!loan_id || !payment_amount || !payment_date) {
      return res.status(400).json({
        success: false,
        message: "loan_id, payment_amount, and payment_date are required.",
      });
    }

    const payment = await paymentService.addPayment({
      loan_id,
      payment_amount,
      payment_date,
      remarks,
    });

    if (req.user && req.user.id) {
      await AuditLog.create({
        user_id: req.user.id,
        action: "create",
        entity_type: "payment",
        entity_id: payment.payment_id,
      }).catch(console.error);
    }

    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** GET /api/payments/:loan_id */
const getByLoan = async (req, res) => {
  try {
    const result = await paymentService.getPaymentsByLoanId(req.params.loan_id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** DELETE /api/payments/:id */
const remove = async (req, res) => {
  try {
    const result = await paymentService.deletePayment(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { create, getByLoan, remove };
