const jwt = require("jsonwebtoken");

const generateActionToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m", // email links valid for 15 minutes
    });
};

module.exports = generateActionToken;
