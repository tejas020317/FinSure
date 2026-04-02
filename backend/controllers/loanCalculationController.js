const { calculateLoan } = require("../services/loanCalculationService");

/** GET /api/loans/:id/calculation */
const getLoanCalculation = async (req, res) => {
  try {
    const { id } = req.params;
    const { as_of_date } = req.query; // optional query param

    const result = await calculateLoan(id, as_of_date || undefined);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getLoanCalculation };
