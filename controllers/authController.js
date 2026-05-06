const User = require("../models/smartlogin/User");
const AttackLog = require("../models/smartlogin/AttackLog");
const BlockedIP = require("../models/smartlogin/BlockedIP");
const bcrypt = require("bcryptjs");
const sendSecurityEmail = require("../utils/sendSecurityEmail");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// ================= IP UTILS =================
const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || "Unknown";
};

// ================= LOCATION =================
const getLocationFromIP = async (ip) => {
  if (ip === "::1" || ip === "127.0.0.1" || ip === "Unknown") {
    return { country: "Localhost", city: "Localhost" };
  }
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}`);
    if (res.data.status === "success") {
      return { country: res.data.country, city: res.data.city };
    }
  } catch {}
  return { country: "Unknown", city: "Unknown" };
};

// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const ip = getClientIP(req);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "User account already exists." });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name || "User",
      email: normalizedEmail,
      password: hash,
      ipAddress: ip,
      loginAttempts: { count: 0, firstAttemptTime: null },
      lockedUntil: null
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

// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = getClientIP(req);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 1. Check IP Block
    const blocked = await BlockedIP.findOne({ ip });
    if (blocked) { // IP Block is indefinite or until removed by admin
       return res.status(403).json({ message: "Your IP is blocked due to suspicious activity." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Ensure loginAttempts object exists
    if (user && !user.loginAttempts) {
      user.loginAttempts = { count: 0, firstAttemptTime: null };
    }

    // 2. Check Account Lock (15 min)
    if (user && user.lockedUntil && user.lockedUntil > Date.now()) {
      return res.status(403).json({ message: "Account is temporarily locked. Try again later." });
    }

    const location = await getLocationFromIP(ip);
    const device = req.headers["user-agent"] || "Unknown Device";

    // 3. User Not Found
    if (!user) {
      await AttackLog.create({
        userId: null,
        ip,
        location,
        attackType: "FAILED_LOGIN",
        severity: "LOW",
        payload: { reason: "User not found" },
        timestamp: new Date()
      });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // 4. Failed Login
    if (!isMatch) {
      user.loginAttempts.count += 1;
      if (user.loginAttempts.count === 1) {
        user.loginAttempts.firstAttemptTime = new Date();
      }
      await user.save();

      const { count } = user.loginAttempts;

      // THRESHOLD: 20 -> Block IP, Lock Account, Attack Log, Email Type 2
      if (count >= 20) {
         await BlockedIP.create({
            ip,
            reason: "Exceeded maximum failed login attempts (Brute Force)",
            blockedAt: new Date()
         });

         user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
         await user.save();

         await AttackLog.create({
            userId: user._id,
            ip,
            location,
            attackType: "BRUTE_FORCE",
            severity: "HIGH",
            payload: { reason: "20 failed attempts" },
            timestamp: new Date()
         });

         await sendSecurityEmail(user.email, ip, location, count, device, true);

         return res.status(429).json({ message: "Too many failed attempts. Account locked/IP blocked." });
      }

      // THRESHOLD: 5 -> Email Type 1 (with Buttons)
      if (count === 5) {
         const jwtSecret = process.env.JWT_SECRET || "threatguard_secret_key";
         const blockToken = jwt.sign({ action: "block", ip, email: user.email }, jwtSecret, { expiresIn: "1h" });
         const resetToken = jwt.sign({ action: "reset", email: user.email }, jwtSecret, { expiresIn: "1h" });

         await sendSecurityEmail(user.email, ip, location, count, device, false, blockToken, resetToken);
      } else if (count !== 5 && count < 20) {
         await AttackLog.create({
            userId: user._id,
            ip,
            location,
            attackType: "FAILED_LOGIN",
            severity: "LOW",
            payload: { reason: "Invalid password" },
            timestamp: new Date()
         });
      }

      return res.status(401).json({ message: `Invalid credentials. Attempt ${count} of 20` });
    }

    // 5. Successful Login
    user.loginAttempts = { count: 0, firstAttemptTime: null };
    user.lockedUntil = null;
    user.lastLogin = new Date();
    user.ipAddress = ip;
    await user.save();

    await AttackLog.create({
      userId: user._id,
      ip,
      location,
      attackType: "SUCCESSFUL_LOGIN",
      severity: "LOW",
      payload: { reason: "Login successful" },
      timestamp: new Date()
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "threatguard_secret_key",
      { expiresIn: "10h" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= EMAIL ACTIONS =================
exports.blockIpAction = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token missing" });

    const jwtSecret = process.env.JWT_SECRET || "threatguard_secret_key";
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.action !== "block" || !decoded.ip) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const blocked = await BlockedIP.findOne({ ip: decoded.ip });
    if (!blocked) {
      await BlockedIP.create({ ip: decoded.ip, reason: "Blocked via user email action", blockedAt: new Date() });
    }

    res.send("<h2>IP has been successfully blocked from accessing your account.</h2>");

  } catch (err) {
    res.status(400).send("<h2>Invalid or expired token.</h2>");
  }
};

exports.resetAttemptsAction = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token missing" });

    const jwtSecret = process.env.JWT_SECRET || "threatguard_secret_key";
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.action !== "reset" || !decoded.email) {
      return res.status(400).json({ message: "Invalid token" });
    }

    await User.updateOne(
      { email: decoded.email }, 
      { $set: { "loginAttempts.count": 0, "loginAttempts.firstAttemptTime": null } }
    );

    res.send("<h2>Your account attempts have been reset. Thank you for verifying!</h2>");

  } catch (err) {
    res.status(400).send("<h2>Invalid or expired token.</h2>");
  }
};