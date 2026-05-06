const express = require("express");
const router = express.Router();

const { registerUser, loginUser, blockIpAction, resetAttemptsAction } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);

// Explicit endpoints for Email Action Links
router.get("/block-ip", blockIpAction);
router.get("/reset-attempts", resetAttemptsAction);

module.exports = router;