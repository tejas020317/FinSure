const express = require("express");
const router = express.Router();
const {
  create,
  getAll,
  getOne,
  update,
  remove,
} = require("../controllers/customerController");

// POST   /api/customers
router.post("/", create);

// GET    /api/customers
router.get("/", getAll);

// GET    /api/customers/:id
router.get("/:id", getOne);

// PUT    /api/customers/:id
router.put("/:id", update);

// DELETE /api/customers/:id
router.delete("/:id", remove);

module.exports = router;
