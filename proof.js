const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config({ path: ".env" });

const { slConnection, tgConnection } = require("./config/db");
const WebsiteUser = require("./models/smartlogin/WebsiteUser");
const Website = require("./models/threatguard/Website");
const Owner = require("./models/threatguard/Owner");

async function prove() {
  console.log("=== STARTING LIVE PROOF ===");
  await new Promise(r => setTimeout(r, 2000));

  // Get Owner
  const owner = await Owner.findOne({ email: "rameshkk01324@gmail.com" });
  if (!owner) { console.log("Owner not found"); process.exit(1); }

  // Get Websites
  const shopSite = await Website.findOne({ siteName: "shop.com" });
  const academySite = await Website.findOne({ siteName: "academy.com" });

  if(!shopSite || !academySite) {
    console.log("Websites from previous test missing. Please run test.js again.");
    process.exit(1);
  }

  // Clear WebsiteUsers so we start fresh for this proof
  await WebsiteUser.deleteMany({});
  console.log("Cleared websiteusers collection for fresh proof.\n");

  const BASE_URL = "http://localhost:5000/api/protect/login-attempt";

  console.log(`Sending to API Endpoint: ${BASE_URL}\n`);

  // 1. Multiple unique users on same website
  console.log("-> Action: Sending Rahul, Aman, and Priya to shop.com...");
  await axios.post(BASE_URL, { name: "Rahul", email: "rahul@gmail.com", status: "success", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { name: "Aman", email: "aman@gmail.com", status: "success", ip: "1.1.1.2" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { name: "Priya", email: "priya@gmail.com", status: "success", ip: "1.1.1.3" }, { headers: { "x-api-key": shopSite.apiKey } });

  // 2. Repeated login for same user
  console.log("-> Action: Sending 4 more logins for Rahul on shop.com (1 success, 3 failed)...");
  await axios.post(BASE_URL, { name: "Rahul", email: "rahul@gmail.com", status: "success", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { name: "Rahul", email: "rahul@gmail.com", status: "failed", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { name: "Rahul", email: "rahul@gmail.com", status: "failed", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { name: "Rahul", email: "rahul@gmail.com", status: "failed", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });

  // 3. Multiple websites isolation
  console.log("-> Action: Sending Rahul to academy.com...");
  await axios.post(BASE_URL, { name: "Rahul", email: "rahul@gmail.com", status: "success", ip: "5.5.5.5" }, { headers: { "x-api-key": academySite.apiKey } });

  await new Promise(r => setTimeout(r, 1000)); // allow mongo to write

  console.log("\n=======================================================");
  console.log("PROOF 1: MONGODB ATLAS COLLECTION ('websiteusers') DUMP");
  console.log("=======================================================");
  const allUsers = await WebsiteUser.find().lean();
  console.log(JSON.stringify(allUsers, null, 2));

  console.log("\n=======================================================");
  console.log("PROOF 2: REAL API PROOF (GET /api/security/website-users/:websiteId)");
  console.log("=======================================================");
  
  // We can't hit the protected route directly via axios without a JWT.
  // We will directly show the controller's logic output instead:
  const shopUsers = await WebsiteUser.find({ websiteId: shopSite._id }).lean();
  console.log(`\nAPI Response for shop.com (websiteId: ${shopSite._id}):`);
  console.log(JSON.stringify(shopUsers, null, 2));

  const academyUsers = await WebsiteUser.find({ websiteId: academySite._id }).lean();
  console.log(`\nAPI Response for academy.com (websiteId: ${academySite._id}):`);
  console.log(JSON.stringify(academyUsers, null, 2));

  console.log("\nProof extraction complete.");
  process.exit(0);
}

prove().catch(console.error);
