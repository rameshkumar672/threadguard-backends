const EmailAction = require("../models/smartlogin/EmailAction");
const AttackLog = require("../models/smartlogin/AttackLog");
const BlockedIP = require("../models/smartlogin/BlockedIP");
const Website = require("../models/threatguard/Website");
const WebsiteUser = require("../models/smartlogin/WebsiteUser");

// ================= HELPER =================
const getUserWebsiteIds = async (userId) => {
  const websites = await Website.find({ ownerId: userId });
  return websites.map((w) => w._id);
};

// ================= IT WAS ME =================
exports.itWasMe = async (req, res) => {
  try {
    const { token } = req.query;

    const action = await EmailAction.findOne({ token });

    if (!action) {
      return res.send("❌ Invalid or expired link.");
    }

    await AttackLog.updateMany(
      {
        email: action.email,
        status: "failed"
      },
      {
        actionTaken: "user-confirmed"
      }
    );

    await EmailAction.deleteOne({ token });

    res.send("✅ Login confirmed.");

  } catch (err) {
    console.error(err);
    res.send("❌ Server error.");
  }
};

// ================= BLOCK IP =================
exports.blockIP = async (req, res) => {
  try {
    const { token } = req.query;

    const action = await EmailAction.findOne({ token });

    if (!action) {
      return res.send("❌ Invalid or expired link.");
    }

    const blockedUntil = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await BlockedIP.create({
      ownerId: action.ownerId,
      websiteId: action.websiteId,
      ip: action.ip,
      reason: "Manual block",
      blockedUntil
    });

    await AttackLog.updateMany(
      {
        email: action.email
      },
      {
        actionTaken: "ip-blocked"
      }
    );

    await EmailAction.deleteOne({ token });

    res.send("🚫 IP blocked for 24 hours.");

  } catch (err) {
    console.error(err);
    res.send("❌ Server error.");
  }
};

// ================= ATTACK MAP =================
exports.getAttackMap = async (req, res) => {
  try {
    const websiteIds = await getUserWebsiteIds(req.user.id);

    const attacks = await AttackLog.find({
      websiteId: { $in: websiteIds }
    })
      .sort({ createdAt: -1 })
      .limit(100);

    const mapData = attacks.map((attack) => ({
      ip: attack.ip,
      country: attack.location?.country || "Unknown",
      city: attack.location?.city || "Unknown",
      latitude: attack.location?.latitude || 0,
      longitude: attack.location?.longitude || 0,
      attackType: attack.attackType,
      severity: attack.severity,
      status: attack.status,
      createdAt: attack.createdAt
    }));

    res.json(mapData);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= ATTACK TIMELINE =================
exports.getAttackTimeline = async (req, res) => {
  try {
    const websiteIds = await getUserWebsiteIds(req.user.id);

    const timeline = await AttackLog.aggregate([
      {
        $match: {
          websiteId: { $in: websiteIds },
          status: "failed",
          attackType: {
            $in: ["Failed Login", "Brute Force Attack", "Credential Stuffing", "Password Spraying"]
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          time: "$_id",
          count: 1
        }
      },
      { $sort: { time: 1 } }
    ]);

    res.json(timeline);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= LOGIN HISTORY =================
exports.getLoginHistory = async (req, res) => {
  try {
    const websiteIds = await getUserWebsiteIds(req.user.id);

    const { type } = req.query;
    const query = { websiteId: { $in: websiteIds } };
    
    if (type === "attacks") {
      query.attackType = { $nin: ["none", "Failed Login"] };
      query.status = { $ne: "success" };
    }

    const history = await AttackLog.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const data = history.map((log) => ({
      userId: log.userId,
      ip: log.ip,
      country: log.location?.country || "Unknown",
      city: log.location?.city || "Unknown",
      attackType: log.attackType,
      severity: log.severity,
      status: log.status,
      createdAt: log.createdAt
    }));

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= BLOCKED IPS =================
exports.getBlockedIPs = async (req, res) => {
  try {
    const websiteIds = await getUserWebsiteIds(req.user.id);

    const blocked = await BlockedIP.find({
      websiteId: { $in: websiteIds }
    }).sort({ createdAt: -1 });

    const data = blocked.map((b) => ({
      _id: b._id,
      ip: b.ip,
      reason: b.reason,
      blockedUntil: b.blockedUntil,
      createdAt: b.createdAt
    }));

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= SECURITY STATS =================
exports.getSecurityStats = async (req, res) => {
  try {
    const websiteIds = await getUserWebsiteIds(req.user.id);

    // const totalAttacks =
    //   await AttackLog.countDocuments({
    //     websiteId: { $in: websiteIds },
    //     status: { $in: ["failed", "blocked"] }
    //   });
    const totalAttacks =
      await AttackLog.countDocuments({
        websiteId: { $in: websiteIds },
        attackType: {
          $ne: "none"
        },
        status: { $ne: "success" }
      });

    const threatCount =
      await AttackLog.countDocuments({
        websiteId: { $in: websiteIds },
        attackType: {
          $nin: ["none", "Failed Login"]
        },
        status: { $ne: "success" }
      });

    const successfulLogins =
      await AttackLog.countDocuments({
        websiteId: { $in: websiteIds },
        status: "success"
      });

    const blockedIPs =
      await BlockedIP.countDocuments({
        websiteId: { $in: websiteIds }
      });

    res.json({
      totalAttacks,
      threatCount,
      successfulLogins,
      blockedIPs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= SECURITY SCORE =================
exports.getSecurityScore = async (req, res) => {
  try {
    const websiteIds = await getUserWebsiteIds(req.user.id);

    // const totalAttacks =
    //   await AttackLog.countDocuments({
    //     websiteId: { $in: websiteIds },
    //     status: "failed"
    //   });
    const totalAttacks =
      await AttackLog.countDocuments({
        websiteId: { $in: websiteIds },
        attackType: {
          $ne: "none"
        },
        status: { $ne: "success" }
      });

    const threatCount =
      await AttackLog.countDocuments({
        websiteId: { $in: websiteIds },
        attackType: {
          $nin: ["none", "Failed Login"]
        },
        status: { $ne: "success" }
      });

    const blockedIPs =
      await BlockedIP.countDocuments({
        websiteId: { $in: websiteIds }
      });

    const criticalAttacks =
      await AttackLog.countDocuments({
        websiteId: { $in: websiteIds },
        severity: "CRITICAL"
      });

    const successfulLogins =
      await AttackLog.countDocuments({
        websiteId: { $in: websiteIds },
        status: "success"
      });

    let score = 100;

    score -= totalAttacks * 1;
    score -= blockedIPs * 2;
    score -= criticalAttacks * 5;

    if (score < 0) score = 0;

    res.json({
      securityScore: score,
      totalAttacks,
      threatCount,
      blockedIPs,
      criticalAttacks,
      successfulLogins
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= UNBLOCK IP =================
exports.unblockIP = async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({
        message: "IP required"
      });
    }

    await BlockedIP.deleteMany({ ip });

    res.json({
      message: `IP ${ip} unblocked successfully`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= AI EXPLANATION =================
exports.getAIExplanation = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await AttackLog.findById(logId);

    if (!log) {
      return res.status(404).json({
        message: "Attack log not found"
      });
    }

    res.json({
      logId: log._id,
      attackType: log.attackType,
      severity: log.severity,
      explanation: `Threat detected from IP ${log.ip}`,
      mitigation: "Keep monitoring and maintain rate limiting.",
      generatedAt: new Date()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= GLOBAL STATS =================
exports.getGlobalStats = async (req, res) => {
  try {
    const totalWebsites =
      await Website.countDocuments();

    const totalAttacks =
      await AttackLog.countDocuments();

    const totalBlockedIPs =
      await BlockedIP.countDocuments();

    res.json({
      totalWebsites,
      totalAttacks,
      totalBlockedIPs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ================= WEBSITE USERS =================
exports.getWebsiteUsers = async (req, res) => {
  try {
    const { websiteId } = req.params;
    
    // Ensure the website belongs to the owner
    const websites = await getUserWebsiteIds(req.user.id);
    if (!websites.some(id => id.toString() === websiteId)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const users = await WebsiteUser.find({ websiteId }).sort({ lastLogin: -1 });
    res.json(users);
  } catch (err) {
    console.error("Fetch website users failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getWebsiteUserByEmail = async (req, res) => {
  try {
    const { websiteId, email } = req.params;

    const websites = await getUserWebsiteIds(req.user.id);
    if (!websites.some(id => id.toString() === websiteId)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await WebsiteUser.findOne({ websiteId, email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    res.json(user);
  } catch (err) {
    console.error("Fetch website user failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};