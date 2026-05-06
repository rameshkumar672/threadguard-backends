const crypto = require("crypto");
const AttackLog = require("../models/smartlogin/AttackLog");
const BlockedIP = require("../models/smartlogin/BlockedIP");
const WebsiteUser = require("../models/smartlogin/WebsiteUser");
const sendSecurityAlert = require("../utils/sendSecurityEmail");

exports.loginAttempt = async (req, res) => {
  try {
    const { email, name, status, ip, password } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : null;
    const normalizedPassword = password ? password.trim() : null;

    if (!ip || !status) {
      return res.status(400).json({
        message: "ip and status fields are required."
      });
    }

    if (!["success", "failed"].includes(status)) {
      return res.status(400).json({
        message: "status must be success or failed"
      });
    }

    const website = req.website;

    if (!website.verified) {
      return res.status(403).json({
        message: "Website is not verified."
      });
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    let passwordFingerprint = null;

    if (normalizedPassword) {
      passwordFingerprint = crypto
        .createHash("sha256")
        .update(normalizedPassword)
        .digest("hex");
    }

    let attackType = "none";
    let severityLevel = "LOW";
    let reason = "";
    let actionTaken = "monitoring";

    if (status === "failed") {
      attackType = "Failed Login";
      reason = "Invalid credentials on protected website";

      // -----------------------------
      // BRUTE FORCE CHECK (same email)
      // -----------------------------
      const recentAttemptsFromEmail = await AttackLog.countDocuments({
        email: normalizedEmail,
        websiteId: website._id,
        status: "failed",
        createdAt: { $gte: fiveMinsAgo }
      });

      // -----------------------------
      // MULTI ACCOUNT CHECK (same IP)
      // -----------------------------
      const recentFailedFromIP = await AttackLog.find({
        ip,
        websiteId: website._id,
        status: "failed",
        createdAt: { $gte: fiveMinsAgo }
      });

      const emailSet = new Set();
      const passwordSet = new Set();

      for (const log of recentFailedFromIP) {
        if (log.email) {
          emailSet.add(log.email);
        }

        if (log.payload && log.payload.passwordFingerprint) {
          passwordSet.add(log.payload.passwordFingerprint);
        }
      }

      // current request ko manually include karo
      if (normalizedEmail) {
        emailSet.add(normalizedEmail);
      }

      if (passwordFingerprint) {
        passwordSet.add(passwordFingerprint);
      }

      const uniqueEmailsCount = emailSet.size;
      const uniquePasswordsCount = passwordSet.size;

      console.log("REQ PASSWORD:", normalizedPassword);
      console.log("PASSWORD FINGERPRINT:", passwordFingerprint);
      console.log("UNIQUE EMAILS:", uniqueEmailsCount);
      console.log("UNIQUE PASSWORDS:", uniquePasswordsCount);

      // -----------------------------
      // CLASSIFICATION LOGIC
      // -----------------------------

      // Password Spraying
      if (
        uniqueEmailsCount >= 5 &&
        uniquePasswordsCount === 1
      ) {
        attackType = "Password Spraying";
        severityLevel = "HIGH";
        reason = "Same password used across multiple accounts";
        actionTaken =
          uniqueEmailsCount >= 15
            ? "ip-blocked"
            : "alert-triggered";
      }

      // Credential Stuffing
      else if (
        uniqueEmailsCount >= 5 &&
        uniquePasswordsCount > 1
      ) {
        attackType = "Credential Stuffing";
        severityLevel = "HIGH";
        reason =
          "Multiple credential pairs used across multiple accounts";
        actionTaken =
          uniqueEmailsCount >= 15
            ? "ip-blocked"
            : "alert-triggered";
      }

      // Brute Force
      else if (recentAttemptsFromEmail + 1 >= 5) {
        attackType = "Brute Force Attack";
        severityLevel = "HIGH";
        reason = `${recentAttemptsFromEmail + 1} failed attempts in 5 minutes`;
        actionTaken =
          recentAttemptsFromEmail + 1 >= 15
            ? "ip-blocked"
            : "alert-triggered";
      }
    }

    console.log("DETECTED ATTACK:", attackType);

    // SAVE LOG AFTER CLASSIFICATION
    const attackLogDoc = await AttackLog.create({
      ip,
      attackType,
      severity: severityLevel,
      ownerId: website.ownerId,
      websiteId: website._id,
      location: req.location || {},
      email: normalizedEmail || "unknown",
      status,
      reason,
      actionTaken,
      userAgent: req.headers["user-agent"] || "unknown",
      payload: passwordFingerprint
        ? {
          passwordFingerprint,
          email: normalizedEmail || "unknown"
        }
        : null
    });

    // BLOCK IP
    if (actionTaken === "ip-blocked") {
      const exists = await BlockedIP.findOne({
        ip,
        websiteId: website._id
      });

      if (!exists) {
        await BlockedIP.create({
          ip,
          ipAddress: ip,
          reason: attackType,
          ownerId: website.ownerId,
          websiteId: website._id,
          blockedUntil: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          )
        });
      }
    }

    // EMAIL ALERT
    if (
      [
        "Password Spraying",
        "Credential Stuffing",
        "Brute Force Attack"
      ].includes(attackType)
    ) {
      await sendSecurityAlert(
        normalizedEmail,
        ip,
        req.location || {},
        1,
        website.ownerId,
        website._id,
        req.headers["user-agent"] || "Unknown Device"
      );
    }

    // WEBSITE USER TRACKING
    if (normalizedEmail) {
      const updateDoc = {
        $inc: { totalLogins: 1 },
        $set: {
          lastLogin: new Date(),
          name: name || normalizedEmail.split("@")[0]
        },
        $setOnInsert: {
          ownerId: website.ownerId
        }
      };

      if (status === "success") {
        updateDoc.$inc.successfulLogins = 1;
      } else {
        updateDoc.$inc.failedLogins = 1;

        if (
          attackType !== "Failed Login" &&
          attackType !== "none"
        ) {
          updateDoc.$inc.attackCount = 1;
          updateDoc.$addToSet = {
            attackTypes: attackType,
            attackLocations:
              req.location?.country || "Unknown"
          };

          updateDoc.$set.lastAttackLocation =
            req.location?.country || "Unknown";
        }
      }

      await WebsiteUser.findOneAndUpdate(
        {
          websiteId: website._id,
          email: normalizedEmail
        },
        updateDoc,
        {
          upsert: true,
          new: true
        }
      );
    }

    // SOCKET
    const io = req.app.get("io");

    if (
      io &&
      [
        "Brute Force Attack",
        "Credential Stuffing",
        "Password Spraying"
      ].includes(attackType)
    ) {
      io.to(website.ownerId.toString()).emit("new_attack", {
        ip,
        attackType,
        severity: severityLevel,
        country: req.location?.country || "Unknown",
        website: website.websiteUrl,
        email: normalizedEmail,
        time: new Date()
      });
    }

    res.json({
      message: "Login attempt recorded",
      attackType,
      severityLevel,
      actionTaken
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};