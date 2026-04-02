const { Customer } = require("../models");

/**
 * Create a new customer.
 */
const createCustomer = async (data) => {
  const existing = await Customer.findOne({
    where: { account_number: data.account_number },
  });
  if (existing) {
    const error = new Error("Customer with this account number already exists.");
    error.statusCode = 409;
    throw error;
  }

  const customer = await Customer.create(data);
  return customer;
};

/**
 * Get all customers.
 */
const getAllCustomers = async () => {
  return await Customer.findAll({ order: [["created_at", "DESC"]] });
};

/**
 * Get a single customer by ID.
 */
const getCustomerById = async (id) => {
  const customer = await Customer.findByPk(id);
  if (!customer) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    throw error;
  }
  return customer;
};

/**
 * Update a customer by ID.
 */
const updateCustomer = async (id, data) => {
  const customer = await Customer.findByPk(id);
  if (!customer) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    throw error;
  }

  await customer.update(data);
  return customer;
};

/**
 * Delete a customer by ID.
 */
const deleteCustomer = async (id) => {
  const customer = await Customer.findByPk(id);
  if (!customer) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    throw error;
  }

  await customer.destroy();
  return { message: "Customer deleted successfully." };
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
