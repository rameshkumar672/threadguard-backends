const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config({ path: "../.env" });

const { slConnection, tgConnection } = require("../backend/config/db");
const Website = require("../backend/models/threatguard/Website");
const WebsiteUser = require("../backend/models/smartlogin/WebsiteUser");
const Owner = require("../backend/models/threatguard/Owner");

async function runTest() {
  console.log("Waiting for DB connection...");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 1. Get an owner and 2 websites
  const owner = await Owner.findOne({});
  if (!owner) {
    console.log("No owner found!");
    process.exit(1);
  }

  let websites = await Website.find({ ownerId: owner._id });
  if (websites.length < 2) {
    console.log("Creating dummy websites for test...");
    const site1 = await Website.create({
      siteName: "shop.com",
      websiteUrl: "https://shop.com",
      ownerId: owner._id,
      apiKey: "test-api-key-shop",
      status: "active",
      verified: true
    });
    const site2 = await Website.create({
      siteName: "academy.com",
      websiteUrl: "https://academy.com",
      ownerId: owner._id,
      apiKey: "test-api-key-academy",
      status: "active",
      verified: true
    });
    websites = [site1, site2];
  }

  const shopSite = websites[0];
  const academySite = websites[1];

  console.log(`\nUsing websites: ${shopSite.siteName} (${shopSite.apiKey}) and ${academySite.siteName} (${academySite.apiKey})`);

  // Clear existing users for a clean test
  await WebsiteUser.deleteMany({ websiteId: { $in: [shopSite._id, academySite._id] } });

  const BASE_URL = "http://localhost:5000/api/protect/login-attempt";

  // TEST 1 — New Users Creation
  console.log("\n=== TEST 1: New Users Creation ===");
  await axios.post(BASE_URL, { email: "rahul@gmail.com", name: "Rahul", status: "success", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { email: "aman@gmail.com", name: "Aman", status: "success", ip: "1.1.1.2" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { email: "priya@gmail.com", name: "Priya", status: "success", ip: "1.1.1.3" }, { headers: { "x-api-key": shopSite.apiKey } });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  let users1 = await WebsiteUser.find({ websiteId: shopSite._id });
  console.log(`Expected 3 users on ${shopSite.siteName}. Found: ${users1.length}`);
  users1.forEach(u => console.log(` - ${u.name} (${u.email})`));

  // TEST 2 — Same User Update
  console.log("\n=== TEST 2: Same User Update ===");
  await axios.post(BASE_URL, { email: "rahul@gmail.com", name: "Rahul", status: "success", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { email: "rahul@gmail.com", name: "Rahul", status: "success", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });
  await axios.post(BASE_URL, { email: "rahul@gmail.com", name: "Rahul", status: "failed", ip: "1.1.1.1" }, { headers: { "x-api-key": shopSite.apiKey } });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  let rahulUpdate = await WebsiteUser.findOne({ websiteId: shopSite._id, email: "rahul@gmail.com" });
  console.log("Updated Rahul Document:");
  console.log(` - Total Logins: ${rahulUpdate.totalLogins} (Expected 4)`);
  console.log(` - Success: ${rahulUpdate.successfulLogins} (Expected 3)`);
  console.log(` - Failed: ${rahulUpdate.failedLogins} (Expected 1)`);

  // TEST 3 — Website Isolation
  console.log("\n=== TEST 3: Website Isolation ===");
  await axios.post(BASE_URL, { email: "rahul@gmail.com", name: "Rahul", status: "success", ip: "2.2.2.2" }, { headers: { "x-api-key": academySite.apiKey } });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  let rahulAcademy = await WebsiteUser.findOne({ websiteId: academySite._id, email: "rahul@gmail.com" });
  console.log(`Rahul on ${academySite.siteName}:`);
  console.log(` - Total Logins: ${rahulAcademy.totalLogins} (Expected 1)`);
  
  let rahulShop = await WebsiteUser.findOne({ websiteId: shopSite._id, email: "rahul@gmail.com" });
  console.log(`Rahul on ${shopSite.siteName}:`);
  console.log(` - Total Logins: ${rahulShop.totalLogins} (Expected 4)`);
  console.log(`Are they separate documents? ${rahulAcademy._id.toString() !== rahulShop._id.toString()}`);

  // TEST 5 — Attack Tracking
  console.log("\n=== TEST 5: Attack Tracking ===");
  // Send 6 failed attempts to trigger Brute Force
  for(let i=0; i<6; i++) {
    await axios.post(BASE_URL, { email: "attacker@gmail.com", name: "Attacker", status: "failed", ip: "6.6.6.6" }, { headers: { "x-api-key": shopSite.apiKey } });
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  let attacker = await WebsiteUser.findOne({ websiteId: shopSite._id, email: "attacker@gmail.com" });
  console.log("Attacker Document:");
  console.log(` - Failed Logins: ${attacker.failedLogins} (Expected 6)`);
  console.log(` - Attack Count: ${attacker.attackCount} (Expected > 0)`);
  console.log(` - Attack Types: ${attacker.attackTypes.join(", ")}`);

  console.log("\nTests Complete.");
  process.exit(0);
}

runTest().catch(console.error);
