const express = require("express");
const router = express.Router();

const { registerOwner, loginOwner } = require("../controllers/threatguardController");

router.post("/register", registerOwner);
router.post("/login", loginOwner);

module.exports = router;
