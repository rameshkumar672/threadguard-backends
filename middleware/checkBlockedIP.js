const BlockedIP = require("../models/smartlogin/BlockedIP");

module.exports = async (req, res, next) => {
    const ip = req.body.ip || req.ip;

    const blocked = await BlockedIP.findOne({
        ip: ip,
        blockedUntil: { $gt: new Date() },
    });

    if (blocked) {
        return res.status(403).json({
            message: "Your IP is temporarily blocked due to suspicious activity",
        });
    }

    next();
};
