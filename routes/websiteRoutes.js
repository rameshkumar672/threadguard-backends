// const express = require("express");
// const router = express.Router();

// const {
//   addWebsite,
//   getUserWebsites,
//   deleteWebsite,
//   verifyWebsite,
//   downloadVerificationFile,
//   updateWebsiteSettings
// } = require("../controllers/websiteController");

// const jwtAuth = require("../middleware/jwtAuth");

// // ================= ADD WEBSITE =================
// // POST /api/websites
// router.post("/", jwtAuth, addWebsite);

// // ================= GET ALL WEBSITES (OF LOGGED-IN USER) =================
// // GET /api/websites
// router.get("/", jwtAuth, getUserWebsites);

// // ================= DELETE WEBSITE =================
// // DELETE /api/websites/:id
// router.delete("/:id", jwtAuth, deleteWebsite);

// // ================= VERIFY WEBSITE =================
// // POST /api/websites/verify/:id
// router.post("/verify/:id", jwtAuth, verifyWebsite);

// // ================= UPDATE WEBSITE SETTINGS =================
// // PUT /api/websites/settings/:id
// router.put("/settings/:id", jwtAuth, updateWebsiteSettings);

// // ================= DOWNLOAD VERIFICATION FILE =================
// // GET /api/websites/download-file/:id
// router.get("/download-file/:id", jwtAuth, downloadVerificationFile);

// module.exports = router;
const express = require("express");
const router = express.Router();

const {
  addWebsite,
  getUserWebsites,
  deleteWebsite,
  verifyWebsite,
  downloadVerificationFile,
  updateWebsiteSettings
} = require("../controllers/websiteController");

const jwtAuth = require("../middleware/jwtAuth");

// ================= ADD WEBSITE =================
router.post("/", jwtAuth, addWebsite);

// ================= GET USER WEBSITES =================
router.get("/", jwtAuth, getUserWebsites);

// ================= DELETE WEBSITE =================
router.delete("/:id", jwtAuth, deleteWebsite);

// ================= VERIFY WEBSITE =================
// GET rakha hai taaki browser se direct test kar sako
router.get("/verify/:id", verifyWebsite);

// ================= UPDATE WEBSITE SETTINGS =================
router.put("/settings/:id", jwtAuth, updateWebsiteSettings);

// ================= DOWNLOAD VERIFICATION FILE =================
router.get("/download-file/:id", jwtAuth, downloadVerificationFile);

module.exports = router;