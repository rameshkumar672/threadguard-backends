const express = require("express");
const router = express.Router();
const jwtAuth = require("../middleware/jwtAuth");

const {
  exportPDFReport,
  exportCSVReport,
  getAttackSummary
} = require("../controllers/reportController");

// ================= EXPORT REPORT =================

router.get("/pdf", jwtAuth, exportPDFReport);
router.get("/csv", jwtAuth, exportCSVReport);
router.get("/attack-summary", jwtAuth, getAttackSummary);

module.exports = router;