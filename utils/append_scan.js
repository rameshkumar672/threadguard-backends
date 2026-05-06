const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'controllers', 'protectionController.js');

const scanAttemptFunction = `

// ================= SCAN ATTEMPT (MICROSERVICES ENDPOINT) =================
exports.scanAttempt = async (req, res) => {
  try {
    const { email, ip } = req.body;

    if (!ip) {
       return res.status(400).json({ allowed: false, message: "IP address is required." });
    }

    const AttackLog = require("../models/smartlogin/AttackLog");
    const BlockedIP = require("../models/smartlogin/BlockedIP");

    // 1. Check if IP is already quarantined
    const blocked = await BlockedIP.findOne({ ip });
    if (blocked) {
       return res.json({ allowed: false, message: "Access denied. Your IP is quarantined." });
    }

    // 2. State-based Brute Force Check
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentFails = await AttackLog.countDocuments({
      ip,
      type: "failed_login",
      timestamp: { $gte: fiveMinsAgo }
    });

    if (recentFails >= 5) { 
       return res.json({ allowed: false, message: "Security Lockdown: Continuous failure attempts triggered isolation." });
    }

    // 3. Allowed
    res.json({ allowed: true });

  } catch (err) {
    console.error("Scan Attempt Error:", err);
    res.status(500).json({ allowed: false, message: "Server error" });
  }
};
`;

try {
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes('exports.scanAttempt')) {
        content += scanAttemptFunction;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ scanAttempt appended successfully');
    } else {
        console.log('ℹ️ scanAttempt already exists');
    }
} catch (err) {
    console.error("❌ Append error:", err);
}
