const AttackLog = require("../models/smartlogin/AttackLog");
const BlockedIP = require("../models/smartlogin/BlockedIP");

// Strict Pattern Arrays
const SQL_PATTERNS = [' OR ', ' OR 1=1', 'UNION SELECT', '--', '#', '/*'];
const NOSQL_PATTERNS = ['$ne', '$gt', '$regex', '$where'];
const COMMAND_CHARS = [';', '&&', '||'];
const COMMAND_WORDS = ['ls', 'cat', 'whoami', 'pwd'];
const XSS_PATTERNS = ['<script>', '</script>', 'onerror=', 'onload='];
const BAD_EXTENSIONS = ['.php', '.exe', '.sh'];

// Helper to check if string contains ANY of the substrings (case insensitive)
const containsAny = (str, arr) => arr.some(pattern => str.toUpperCase().includes(pattern.toUpperCase()));

const securityScanner = async (req, res, next) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(',')[0] || req.socket.remoteAddress || "Unknown";
    
    // Check if IP is blocked
    const blocked = await BlockedIP.findOne({ ip });
    if (blocked && (!blocked.blockedUntil || blocked.blockedUntil > new Date())) {
      return res.status(403).json({ message: "Access denied. Your IP is quarantined." });
    }

    const path = req.path;
    const isLoginRequest = path.includes("/login");
    const isQueryInput = Object.keys(req.query).length > 0;
    
    const bodyStr = JSON.stringify(req.body || {});
    const queryStr = JSON.stringify(req.query || {});
    const inspectStr = bodyStr + queryStr;

    let attackType = null;
    let severity = "LOW";
    let payloadStr = "";

    // 1. SQL Injection 
    if (!attackType && (isLoginRequest || isQueryInput) && containsAny(inspectStr, SQL_PATTERNS)) {
      attackType = "SQL_INJECTION";
      severity = "HIGH";
      payloadStr = "SQL injection pattern detected";
    }

    // 2. NoSQL Injection
    if (!attackType && isLoginRequest && containsAny(inspectStr, NOSQL_PATTERNS)) {
      attackType = "NOSQL_INJECTION";
      severity = "HIGH";
      payloadStr = "NoSQL injection pattern detected in login";
    }

    // 3. Command Injection
    if (!attackType && containsAny(inspectStr, COMMAND_CHARS) && containsAny(inspectStr, COMMAND_WORDS)) {
      attackType = "COMMAND_INJECTION";
      severity = "CRITICAL";
      payloadStr = "OS Command Injection sequence detected";
    }

    // 4. XSS
    if (!attackType && containsAny(inspectStr, XSS_PATTERNS)) {
      attackType = "XSS";
      severity = "HIGH";
      payloadStr = "Cross-Site Scripting tags detected";
    }

    // 5. File Upload Attack
    if (!attackType && (req.files || req.file)) {
      const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
      for (const file of files) {
        if (file && file.originalname) {
           const extMatch = BAD_EXTENSIONS.some(ext => file.originalname.toLowerCase().endsWith(ext));
           const mimeMismatch = file.mimetype === "application/x-msdownload" || file.mimetype.includes("php");
           if (extMatch || mimeMismatch) {
             attackType = "FILE_UPLOAD_ATTACK";
             severity = "CRITICAL";
             payloadStr = "Malicious file extension or MIME type detected";
             break;
           }
        }
      }
    }

    // 7. CSRF
    if (!attackType && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      // Ignore auth endpoints logically
      if (!isLoginRequest && !path.includes("/register") && req.headers['origin']) { 
         const csrfHeader = req.headers['x-csrf-token'];
         if (!csrfHeader || csrfHeader.length < 10) {
           attackType = "CSRF";
           severity = "HIGH";
           payloadStr = "Missing or invalid CSRF token on modifying request";
         }
      }
    }

    // 8. IDOR
    if (!attackType && req.user && req.user.id) {
      const targetUserId = req.params.userId || req.body.userId;
      if (targetUserId && String(targetUserId) !== String(req.user.id)) {
        attackType = "IDOR";
        severity = "HIGH";
        payloadStr = `Attempt to access resource for user ${targetUserId} by ${req.user.id}`;
      }
    }

    // Attack Detection Response Logic
    if (attackType) {
      // Payload structure requires specific objects
      let location = { country: "Unknown", city: "Unknown" };
      try {
         const axios = require("axios");
         if (ip !== "::1" && ip !== "127.0.0.1" && ip !== "Unknown") {
            const res = await axios.get(`http://ip-api.com/json/${ip}`);
            if (res.data && res.data.status === "success") {
               location = { country: res.data.country, city: res.data.city };
            }
         }
      } catch (e) {}

      const userId = (req.user && req.user.id) ? req.user.id : null;

      // Ensure AttackLog format is meticulously followed
      await AttackLog.create({
        userId,
        ip,
        location,
        attackType,
        severity,
        payload: { raw: payloadStr },
        timestamp: new Date()
      });

      // BLOCK IP for Command Injection (Brute Force is handled upstream)
      if (attackType === "COMMAND_INJECTION") {
        await BlockedIP.create({
          ip,
          reason: "Critical security violation: OS Command Injection",
          blockedAt: new Date()
        });
      }

      return res.status(403).json({
        message: `Security Lockdown: Malicious request blocked [${attackType}]`
      });
    }

    next();

  } catch (err) {
    console.error("Security Scanner Error:", err);
    next();
  }
};

module.exports = securityScanner;
