const { FixedDeposit, Customer } = require("../models");

// ─────────────────────────────────────────────
// FD Maturity Calculation Helpers
// ─────────────────────────────────────────────

/** Compounding frequency → times per year */
const frequencyMap = {
  monthly: 12,
  quarterly: 4,
  half_yearly: 2,
  yearly: 1,
};

/**
 * Add months to a JS Date and return the resulting date.
 */
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * Calculate FD maturity for a given record.
 * Works for both simple and compound interest types.
 *
 * @param {object} fd  – FixedDeposit instance (or plain object)
 * @returns {{ maturity_amount, interest_earned, maturity_date }}
 */
const computeMaturity = (fd) => {
  const P = parseFloat(fd.deposit_amount);
  const R = parseFloat(fd.interest_rate);
  const T = fd.duration_months / 12; // time in years

  let maturityAmount;

  if (fd.interest_type === "simple") {
    // SI = (P × R × T) / 100
    const si = (P * R * T) / 100;
    maturityAmount = parseFloat((P + si).toFixed(2));
  } else {
    // Compound: A = P(1 + r/n)^(n×t)
    const n = frequencyMap[fd.compounding_frequency] ?? 4; // default quarterly
    const r = R / 100;
    maturityAmount = parseFloat(
      (P * Math.pow(1 + r / n, n * T)).toFixed(2)
    );
  }

  const interestEarned = parseFloat((maturityAmount - P).toFixed(2));
  const maturityDate = addMonths(fd.start_date, fd.duration_months)
    .toISOString()
    .split("T")[0];

  return { maturity_amount: maturityAmount, interest_earned: interestEarned, maturity_date: maturityDate };
};

// ─────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────

/**
 * Create a new Fixed Deposit for a customer.
 */
const createFD = async (data) => {
  const customer = await Customer.findByPk(data.customer_id);
  if (!customer) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    throw error;
  }

  const fd = await FixedDeposit.create(data);

  // Return the FD along with computed maturity details
  const maturity = computeMaturity(fd);
  return { ...fd.toJSON(), ...maturity };
};

/**
 * Get all FDs, optionally filtered by customer_id.
 */
const getAllFDs = async (customerId) => {
  const where = customerId ? { customer_id: customerId } : {};

  const fds = await FixedDeposit.findAll({
    where,
    include: [
      { association: "customer", attributes: ["customer_id", "name", "account_number"] },
    ],
    order: [["start_date", "DESC"]],
  });

  return fds.map((fd) => ({ ...fd.toJSON(), ...computeMaturity(fd) }));
};

/**
 * Get a single FD by ID, with maturity calculation.
 */
const getFDById = async (fdId) => {
  const fd = await FixedDeposit.findByPk(fdId, {
    include: [
      { association: "customer", attributes: ["customer_id", "name", "phone", "account_number"] },
    ],
  });

  if (!fd) {
    const error = new Error("Fixed deposit not found.");
    error.statusCode = 404;
    throw error;
  }

  return { ...fd.toJSON(), ...computeMaturity(fd) };
};

/**
 * Calculate maturity for an FD without persisting — useful for previews.
 */
const calculateFDMaturity = (data) => {
  const P = parseFloat(data.deposit_amount);
  const R = parseFloat(data.interest_rate);
  const T = parseInt(data.duration_months, 10) / 12;

  if (!P || !R || !T || !data.interest_type || !data.start_date) {
    const error = new Error(
      "deposit_amount, interest_rate, duration_months, interest_type, and start_date are required."
    );
    error.statusCode = 400;
    throw error;
  }

  return computeMaturity(data);
};

/**
 * Delete a fixed deposit by ID.
 */
const deleteFD = async (id) => {
  const fd = await FixedDeposit.findByPk(id);
  if (!fd) {
    const error = new Error("Fixed deposit not found.");
    error.statusCode = 404;
    throw error;
  }

  await fd.destroy();
  return { message: "Fixed deposit deleted successfully." };
};

module.exports = { createFD, getAllFDs, getFDById, calculateFDMaturity, deleteFD };
