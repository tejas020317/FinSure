const express = require("express");
const router = express.Router();
const { create, getAll, getOne, calculate, remove } = require("../controllers/fixedDepositController");

// POST   /api/fixed-deposits/calculate  — preview maturity (no DB write)
// NOTE: must be defined before /:id to avoid Express treating "calculate" as an ID
router.post("/calculate", calculate);

// POST   /api/fixed-deposits            — create a new FD
router.post("/", create);

// GET    /api/fixed-deposits?customer_id=:id  — list all FDs (optional filter)
router.get("/", getAll);

// GET    /api/fixed-deposits/:id         — single FD with maturity details
router.get("/:id", getOne);

// DELETE /api/fixed-deposits/:id
router.delete("/:id", remove);

module.exports = router;
