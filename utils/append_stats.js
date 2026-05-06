const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'controllers', 'securityController.js');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    const statsFunction = `

// ================= GLOBAL DASHBOARD STATS =================
exports.getGlobalStats = async (req, res) => {
  try {
    const AttackLog = require("../models/smartlogin/AttackLog");
    const BlockedIP = require("../models/smartlogin/BlockedIP");
    const User = require("../models/smartlogin/User");
    const Website = require("../models/threatguard/Website");

    const totalUsers = await User.countDocuments();
    const totalWebsites = await Website.countDocuments();
    const totalAttacks = await AttackLog.countDocuments();
    const totalBlockedIPs = await BlockedIP.countDocuments();

    res.json({
      totalUsers,
      totalWebsites,
      totalAttacks,
      totalBlockedIPs
    });

  } catch (err) {
    console.error("Global Stats Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
`;

    if (!content.includes('exports.getGlobalStats')) {
        content += statsFunction;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Global Stats appended successfully');
    } else {
        console.log('ℹ️ Stats already exist');
    }

} catch (err) {
    console.error('❌ Error updating file:', err);
    process.exit(1);
}
