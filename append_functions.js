const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'controllers', 'protectionController.js');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    const functionsToAppend = `
// ================= REGISTER CLIENT WEBSITE USER =================
exports.registerClientUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(',')[0] || req.socket.remoteAddress;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const exists = await ClientUser.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User account already exists." });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = await ClientUser.create({
      name: name || "User",
      email,
      password: hash,
      ipAddress: ip
    });

    res.status(201).json({
      message: "User registered successfully.",
      user: { id: newUser._id, email: newUser.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN CLIENT WEBSITE USER =================
exports.loginClientUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(',')[0] || req.socket.remoteAddress;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await ClientUser.findOne({ email });

    if (!user) {
      // Create failure log
      const AttackLog = require("../models/smartlogin/AttackLog");
      await AttackLog.create({
        attackType: "rate_limiting",
        ipAddress: ip,
        email,
        severityLevel: "LOW",
        timestamp: new Date()
      });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      await user.save();

      const AttackLog = require("../models/smartlogin/AttackLog");
      const BlockedIP = require("../models/smartlogin/BlockedIP");

      if (user.loginAttempts >= 5) {
         await AttackLog.create({
            attackType: "brute_force",
            ipAddress: ip,
            email,
            severityLevel: "HIGH",
            timestamp: new Date()
         });

         await BlockedIP.create({
            ip,
            reason: "Exceeded maximum failed login attempts (Brute Force)",
            blockedAt: new Date()
         });

         return res.status(429).json({ message: "Too many failed attempts. Account locked/IP blocked." });
      }

      await AttackLog.create({
         attackType: "rate_limiting",
         ipAddress: ip,
         email,
         severityLevel: "LOW",
         timestamp: new Date()
      });

      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Success
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    user.ipAddress = ip;
    await user.save();

    res.json({
      message: "Login successful.",
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
`;

    if (!content.includes('exports.registerClientUser')) {
        content += functionsToAppend;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Functions appended successfully');
    } else {
        console.log('ℹ️ Functions already exist');
    }

} catch (err) {
    console.error('❌ Error updating file:', err);
    process.exit(1);
}
