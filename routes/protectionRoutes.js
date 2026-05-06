const express = require("express");
const router = express.Router();

const apiKeyAuth = require("../middleware/apiKeyAuth");
const securityScanner = require("../middleware/securityScanner"); // Security scans for SQLi/XSS
const { loginAttempt } = require("../controllers/protectionController");

// ================= PROTECTION API =================

// Standard Endpoint (called by existing clients)
router.post("/login-attempt", apiKeyAuth, securityScanner, loginAttempt);

module.exports = router;