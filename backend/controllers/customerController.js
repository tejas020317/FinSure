const customerService = require("../services/customerService");
const { AuditLog } = require("../models");

/** POST /api/customers */
const create = async (req, res) => {
  try {
    const { name, phone, address, email, account_number } = req.body;

    if (!name || !account_number) {
      return res
        .status(400)
        .json({ success: false, message: "Name and account_number are required." });
    }

    const customer = await customerService.createCustomer({
      name,
      phone,
      address,
      email,
      account_number,
    });

    if (req.user && req.user.id) {
      await AuditLog.create({
        user_id: req.user.id,
        action: "create",
        entity_type: "customer",
        entity_id: customer.customer_id,
      }).catch(console.error);
    }

    return res.status(201).json({ success: true, data: customer });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** GET /api/customers */
const getAll = async (_req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/customers/:id */
const getOne = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** PUT /api/customers/:id */
const update = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/** DELETE /api/customers/:id */
const remove = async (req, res) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { create, getAll, getOne, update, remove };
