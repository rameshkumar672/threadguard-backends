const Website = require("../models/threatguard/Website");

const apiKeyAuth = async (req, res, next) => {
  try {

    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        message: "API key missing"
      });
    }

    const website = await Website.findOne({
      apiKey,
      status: "active"
    });

    if (!website) {
      return res.status(403).json({
        message: "Invalid API key"
      });
    }

    // attach website info to request
    req.website = website;

    next();

  } catch (err) {

    console.error(err);
    res.status(500).json({
      message: "Server error"
    });

  }
};

module.exports = apiKeyAuth;