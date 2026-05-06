const mongoose = require("mongoose");
const { tgConnection, slConnection } = require("../config/db");

const Owner = require("../models/threatguard/Owner");
const Website = require("../models/threatguard/Website");
const User = require("../models/smartlogin/User");
const AttackLog = require("../models/smartlogin/AttackLog");
const BlockedIP = require("../models/smartlogin/BlockedIP");
const EmailAction = require("../models/smartlogin/EmailAction");

async function migrateData() {
  console.log("🚀 Starting Architecture Migration...");

  try {
    // 1. Ensure a Default Owner and Website exists to catch orphan records
    let defaultOwner = await Owner.findOne();
    if (!defaultOwner) {
      console.log("No Owner found! Skipping because we have no root context.");
      process.exit(1);
    }

    let defaultWebsite = await Website.findOne({ ownerId: defaultOwner._id });
    if (!defaultWebsite) {
       defaultWebsite = await Website.create({
         ownerId: defaultOwner._id,
         siteName: "Default System Website",
         websiteUrl: "http://localhost",
         apiKey: "system-migrated-api-key-" + Date.now(),
         verified: true
       });
       console.log("Created Default Website for orphans.");
    } else {
        // Fix Website model if it still uses userId
        if(defaultWebsite.userId) {
            console.log("Updating websites to use ownerId instead of userId");
            await Website.updateMany({}, { $rename: { 'userId': 'ownerId' } });
            console.log("Done renaming userId -> ownerId in websites.");
        }
    }

    const { _id: ownerId } = defaultOwner;
    const { _id: websiteId } = defaultWebsite;

    console.log(`Using Default Owner: ${ownerId} | Default Website: ${websiteId}`);

    // 2. Migrate Users
    console.log("Migrating SmartLogin Users...");
    await User.updateMany(
      { $or: [{ ownerId: { $exists: false } }, { websiteId: { $exists: false } }] },
      { $set: { ownerId, websiteId } }
    );

    // 3. Migrate AttackLogs
    console.log("Migrating SmartLogin AttackLogs...");
    await AttackLog.updateMany(
      { $or: [{ ownerId: { $exists: false } }, { websiteId: { $exists: false } }] },
      { $set: { ownerId, websiteId } }
    );

    // 4. Migrate BlockedIPs
    console.log("Migrating SmartLogin BlockedIPs...");
    await BlockedIP.updateMany(
      { $or: [{ ownerId: { $exists: false } }, { websiteId: { $exists: false } }] },
      { $set: { ownerId, websiteId } }
    );

    // 5. Migrate EmailActions
    console.log("Migrating SmartLogin EmailActions...");
    await EmailAction.updateMany(
      { $or: [{ ownerId: { $exists: false } }, { websiteId: { $exists: false } }] },
      { $set: { ownerId, websiteId } }
    );

    console.log("✅ Migration Complete! You are now fully backwards compatible with the new architecture.");
    process.exit(0);

  } catch (err) {
    console.error("❌ Migration Failed:", err);
    process.exit(1);
  }
}

// Trigger connection logic if they are ready
setTimeout(migrateData, 2000);
