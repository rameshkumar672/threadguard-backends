// const Website = require("../models/threatguard/Website");
// const crypto = require("crypto");

// // ================= GENERATE API KEY =================
// const generateApiKey = () => {
//   return "TG_" + crypto.randomBytes(24).toString("hex");
// };

// // ================= GENERATE VERIFICATION TOKEN =================
// const generateVerificationToken = () => {
//   return crypto.randomBytes(16).toString("hex");
// };


// // ================= ADD WEBSITE =================
// // exports.addWebsite = async (req, res) => {
// //   try {

// //     const { siteName, websiteUrl } = req.body;
// //     const userId = req.user.id;

// //     const apiKey = generateApiKey();
// //     const verificationToken = generateVerificationToken();

// //     const website = await Website.create({
// //       userId,
// //       siteName,
// //       websiteUrl,
// //       apiKey,
// //       verificationToken,
// //       verified: false
// //     });

// //     res.json({
// //       message: "Website added successfully",
// //       website,
// //       verificationFile: {
// //         fileName: `threatguard-verification-${verificationToken}.txt`,
// //         content: verificationToken
// //       }
// //     });

// //   } catch (err) {

// //     console.error(err);
// //     res.status(500).json({ message: "Server error" });

// //   }
// // };
// exports.addWebsite = async (req, res) => {
//   try {
//     const { siteName, websiteUrl } = req.body;

//     const ownerId = req.user.id;

//     if (!siteName || !websiteUrl) {
//       return res.status(400).json({
//         message: "siteName and websiteUrl are required"
//       });
//     }

//     const apiKey = generateApiKey();
//     const verificationToken = generateVerificationToken();

//     const website = await Website.create({
//       ownerId,
//       siteName,
//       websiteUrl,
//       apiKey,
//       verificationToken,
//       verified: false,
//       status: "active"
//     });

//     res.json({
//       message: "Website added successfully",
//       website,
//       verificationFile: {
//         fileName: `threatguard-verification-${verificationToken}.txt`,
//         content: verificationToken
//       }
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };

// // ================= GET USER WEBSITES =================
// exports.getUserWebsites = async (req, res) => {
//   try {

//     const userId = req.user.id;

//     // const websites = await Website.find({ userId });
//     const websites = await Website.find({ ownerId: userId });

//     res.json(websites);

//   } catch (err) {

//     console.error(err);
//     res.status(500).json({ message: "Server error" });

//   }
// };


// // ================= DELETE WEBSITE =================
// exports.deleteWebsite = async (req, res) => {
//   try {

//     const { id } = req.params;

//     await Website.findByIdAndDelete(id);

//     res.json({
//       message: "Website removed successfully"
//     });

//   } catch (err) {

//     console.error(err);
//     res.status(500).json({ message: "Server error" });

//   }
// };

// // ================= DOWNLOAD VERIFICATION FILE =================
// exports.downloadVerificationFile = async (req, res) => {
//   try {

//     const { id } = req.params;

//     const website = await Website.findById(id);

//     if (!website) {
//       return res.status(404).json({ message: "Website not found" });
//     }

//     const fileName = `threatguard-verification-${website.verificationToken}.txt`;
//     const fileContent = website.verificationToken;

//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=${fileName}`
//     );

//     res.setHeader("Content-Type", "text/plain");

//     res.send(fileContent);

//   } catch (err) {

//     console.error(err);
//     res.status(500).json({ message: "Server error" });

//   }
// };

// // ================= VERIFY WEBSITE =================
// const axios = require("axios");

// exports.verifyWebsite = async (req, res) => {
//   try {

//     const { id } = req.params;

//     const website = await Website.findById(id);

//     if (!website) {
//       return res.status(404).json({
//         message: "Website not found"
//       });
//     }

//     const baseUrl = website.websiteUrl.startsWith("http")
//   ? website.websiteUrl
//   : `http://${website.websiteUrl}`;

// const verificationUrl =
//   `${baseUrl}/threatguard-verification-${website.verificationToken}.txt`;

// console.log("Verification URL:", verificationUrl);

//     try {

//       const response = await axios.get(verificationUrl);

//       if (response.data.trim() === website.verificationToken) {

//         website.verified = true;
//         await website.save();

//         return res.json({
//           message: "Website verified successfully"
//         });

//       } else {

//         return res.status(400).json({
//           message: "Verification file content mismatch"
//         });

//       }

//     } catch (err) {

//   console.log("Verify fetch error:", err.message);

//   return res.status(400).json({
//     message: "Verification file not found on your website"
//   });

// }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ================= UPDATE WEBSITE SETTINGS =================
// exports.updateWebsiteSettings = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { settings } = req.body; // Expect { lockdownMode, mfaRequired, rateLimitThreshold }

//     if (!settings) {
//       return res.status(400).json({ message: "Settings object is required" });
//     }

//     const website = await Website.findById(id);

//     if (!website) {
//       return res.status(404).json({ message: "Website not found" });
//     }

//     // Check ownership
//     if (website.userId.toString() !== req.user.id) {
//        return res.status(403).json({ message: "Unauthorized to update this website" });
//     }

//     // Update settings
//     website.settings = {
//       ...website.settings,
//       ...settings
//     };

//     await website.save();

//     res.json({
//       message: "Website settings updated successfully",
//       settings: website.settings
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// const Website = require("../models/threatguard/Website");
// const crypto = require("crypto");
// const axios = require("axios");

// // ================= GENERATE API KEY =================
// const generateApiKey = () => {
//   return "TG_" + crypto.randomBytes(24).toString("hex");
// };

// // ================= GENERATE VERIFICATION TOKEN =================
// const generateVerificationToken = () => {
//   return crypto.randomBytes(16).toString("hex");
// };

// // ================= ADD WEBSITE =================
// exports.addWebsite = async (req, res) => {
//   try {
//     const { siteName, websiteUrl } = req.body;
//     const ownerId = req.user.id;

//     if (!siteName || !websiteUrl) {
//       return res.status(400).json({
//         message: "siteName and websiteUrl are required"
//       });
//     }

//     const apiKey = generateApiKey();
//     const verificationToken = generateVerificationToken();

//     const website = await Website.create({
//       ownerId,
//       siteName,
//       websiteUrl,
//       apiKey,
//       verificationToken,
//       verified: false,
//       status: "active"
//     });

//     res.json({
//       message: "Website added successfully",
//       website,
//       verificationFile: {
//         fileName: `threatguard-verification-${verificationToken}.txt`,
//         content: verificationToken
//       }
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };

// // ================= GET USER WEBSITES =================
// exports.getUserWebsites = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const websites = await Website.find({
//       ownerId: userId
//     });

//     res.json(websites);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };

// // ================= DELETE WEBSITE =================
// exports.deleteWebsite = async (req, res) => {
//   try {
//     const { id } = req.params;

//     await Website.findByIdAndDelete(id);

//     res.json({
//       message: "Website removed successfully"
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };

// // ================= DOWNLOAD VERIFICATION FILE =================
// exports.downloadVerificationFile = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const website = await Website.findById(id);

//     if (!website) {
//       return res.status(404).json({
//         message: "Website not found"
//       });
//     }

//     const fileName = `threatguard-verification-${website.verificationToken}.txt`;
//     const fileContent = website.verificationToken;

//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=${fileName}`
//     );

//     res.setHeader("Content-Type", "text/plain");

//     res.send(fileContent);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };

// // ================= VERIFY WEBSITE =================
// exports.verifyWebsite = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const website = await Website.findById(id);

//     if (!website) {
//       return res.status(404).json({
//         message: "Website not found"
//       });
//     }

//     // Normalize URL
//     let baseUrl = website.websiteUrl.startsWith("http")
//       ? website.websiteUrl
//       : `http://${website.websiteUrl}`;

//     // Fix localhost issue for backend internal request
//     baseUrl = baseUrl.replace("localhost", "127.0.0.1");

//     const verificationUrl =
//       `${baseUrl}/threatguard-verification-${website.verificationToken}.txt`;

//     console.log("Verification URL:", verificationUrl);
//     console.log("Expected Token:", website.verificationToken);

//     try {
//       const response = await axios.get(verificationUrl);

//       console.log("Received Token:", response.data.trim());

//       if (response.data.trim() === website.verificationToken) {
//         website.verified = true;
//         await website.save();

//         return res.json({
//           message: "Website verified successfully",
//           verified: true
//         });
//       } else {
//         return res.status(400).json({
//           message: "Verification file content mismatch"
//         });
//       }

//     } catch (err) {
//       console.log("Verify fetch error:", err.message);

//       return res.status(400).json({
//         message: "Verification file not found on your website"
//       });
//     }

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };

// // ================= UPDATE WEBSITE SETTINGS =================
// exports.updateWebsiteSettings = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { settings } = req.body;

//     if (!settings) {
//       return res.status(400).json({
//         message: "Settings object is required"
//       });
//     }

//     const website = await Website.findById(id);

//     if (!website) {
//       return res.status(404).json({
//         message: "Website not found"
//       });
//     }

//     // Fixed owner check
//     if (website.ownerId.toString() !== req.user.id) {
//       return res.status(403).json({
//         message: "Unauthorized to update this website"
//       });
//     }

//     website.settings = {
//       ...website.settings,
//       ...settings
//     };

//     await website.save();

//     res.json({
//       message: "Website settings updated successfully",
//       settings: website.settings
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error"
//     });
//   }
// };
const Website = require("../models/threatguard/Website");
const crypto = require("crypto");
const axios = require("axios");

// ================= GENERATE API KEY =================
const generateApiKey = () => {
  return "TG_" + crypto.randomBytes(24).toString("hex");
};

// ================= GENERATE VERIFICATION TOKEN =================
const generateVerificationToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

// ================= ADD WEBSITE =================
exports.addWebsite = async (req, res) => {
  try {
    const { siteName, websiteUrl } = req.body;
    const ownerId = req.user.id;

    if (!siteName || !websiteUrl) {
      return res.status(400).json({
        success: false,
        message: "siteName and websiteUrl are required"
      });
    }

    let cleanUrl = websiteUrl.trim();

    if (
      !cleanUrl.startsWith("http://") &&
      !cleanUrl.startsWith("https://")
    ) {
      cleanUrl = "http://" + cleanUrl;
    }

    const apiKey = generateApiKey();
    const verificationToken = generateVerificationToken();

    const website = await Website.create({
      ownerId,
      siteName,
      websiteUrl: cleanUrl,
      apiKey,
      verificationToken,
      verified: false,
      status: "active"
    });

    res.status(201).json({
      success: true,
      message: "Website added successfully",
      website,
      verificationFile: {
        fileName: `threatguard-verification-${verificationToken}.txt`,
        content: verificationToken
      }
    });

  } catch (err) {
    console.error("Add Website Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= GET USER WEBSITES =================
exports.getUserWebsites = async (req, res) => {
  try {
    const userId = req.user.id;

    const websites = await Website.find({
      ownerId: userId
    });

    res.json({
      success: true,
      websites
    });

  } catch (err) {
    console.error("Get Websites Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= DELETE WEBSITE =================
exports.deleteWebsite = async (req, res) => {
  try {
    const { id } = req.params;

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found"
      });
    }

    if (website.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    await Website.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Website removed successfully"
    });

  } catch (err) {
    console.error("Delete Website Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= DOWNLOAD VERIFICATION FILE =================
exports.downloadVerificationFile = async (req, res) => {
  try {
    const { id } = req.params;

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found"
      });
    }

    const fileName = `threatguard-verification-${website.verificationToken}.txt`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );

    res.setHeader("Content-Type", "text/plain");

    res.send(website.verificationToken);

  } catch (err) {
    console.error("Download File Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= VERIFY WEBSITE =================
exports.verifyWebsite = async (req, res) => {
  try {
    const { id } = req.params;

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found"
      });
    }

    let baseUrl = website.websiteUrl.trim();

    if (
      !baseUrl.startsWith("http://") &&
      !baseUrl.startsWith("https://")
    ) {
      baseUrl = "http://" + baseUrl;
    }

    const verificationUrl =
      `${baseUrl}/threatguard-verification-${website.verificationToken}.txt`;

    console.log("Checking:", verificationUrl);

    const response = await axios.get(verificationUrl);

    const receivedToken = response.data.trim();
    const expectedToken = website.verificationToken.trim();

    console.log("Received:", receivedToken);
    console.log("Expected:", expectedToken);

    if (receivedToken === expectedToken) {
      website.verified = true;
      await website.save();

      return res.json({
        success: true,
        message: "Website verified successfully",
        verified: true
      });
    }

    return res.status(400).json({
      success: false,
      message: "Verification token mismatch"
    });

  } catch (err) {
    console.error("Verify Website Error:", err.message);

    res.status(400).json({
      success: false,
      message: "Verification file not found or inaccessible"
    });
  }
};

// ================= UPDATE WEBSITE SETTINGS =================
exports.updateWebsiteSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: "Settings object is required"
      });
    }

    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found"
      });
    }

    if (website.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    website.settings = {
      ...website.settings,
      ...settings
    };

    await website.save();

    res.json({
      success: true,
      message: "Website settings updated successfully",
      settings: website.settings
    });

  } catch (err) {
    console.error("Update Settings Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};