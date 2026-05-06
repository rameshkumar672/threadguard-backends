const geoip = require("geoip-lite");

module.exports = (req, res, next) => {
    let ip = req.ip;

    // ngrok / proxy case handle
    if (ip.includes(",")) {
        ip = ip.split(",")[0];
    }

    const geo = geoip.lookup(ip);

    if (geo) {
        req.location = {
            country: geo.country || "Unknown",
            city: geo.city || "Unknown",
        };
    } else {
        req.location = {
            country: "Unknown",
            city: "Unknown",
        };
    }

    next();
};
