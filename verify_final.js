const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const API_KEY = "TG_e5dcb003306d6108cc9eeabc44193095cc425b582855bb07";
const BASE_URL = "http://localhost:5000/api/protect/login-attempt";

async function run() {
    console.log("🚀 Starting Final Verification...");

    const ip = "111.111.111.111";
    
    console.log("\n--- Step 1: Triggering Credential Stuffing Alert (5 unique emails) ---");
    for (let i = 1; i <= 5; i++) {
        await axios.post(BASE_URL, {
            email: `final_test_${i}@test.com`,
            ip: ip,
            status: "failed",
            name: `User ${i}`
        }, { headers: { "x-api-key": API_KEY } });
        process.stdout.write(".");
    }
    console.log("\n✅ Threshold 5 reached.");

    console.log("\n--- Step 2: Triggering IP Block (15 unique emails) ---");
    for (let i = 6; i <= 15; i++) {
        try {
            await axios.post(BASE_URL, {
                email: `final_test_${i}@test.com`,
                ip: ip,
                status: "failed",
                name: `User ${i}`
            }, { headers: { "x-api-key": API_KEY } });
            process.stdout.write(".");
        } catch (err) {
            console.log("\nGot expected error or issue at attempt " + i + ": " + (err.response?.status || err.message));
        }
    }

    console.log("\n\n📊 Proofs for IP 99.99.99.99:");
    const slConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: "smartlogin" });
    await new Promise(resolve => slConnection.on("connected", resolve));
    
    const AttackLog = slConnection.model("AttackLog", new mongoose.Schema({}, { strict: false }), "attacklogs");
    const BlockedIP = slConnection.model("BlockedIP", new mongoose.Schema({}, { strict: false }), "blockedips");
    const WebsiteUser = slConnection.model("WebsiteUser", new mongoose.Schema({}, { strict: false }), "websiteusers");
    const EmailAction = slConnection.model("EmailAction", new mongoose.Schema({}, { strict: false }), "emailactions");

    const log = await AttackLog.findOne({ ip: ip, attackType: "Credential Stuffing" }).sort({ createdAt: -1 });
    console.log("\n[AttackLog Proof]");
    if (log) {
        console.log(`AttackType: ${log.attackType}`);
        console.log(`Severity: ${log.severity}`);
        console.log(`ActionTaken: ${log.actionTaken}`);
        console.log(`Reason: ${log.reason}`);
    }

    const block = await BlockedIP.findOne({ ip: ip });
    console.log("\n[BlockedIP Proof]");
    if (block) {
        console.log(`IP: ${block.ip} is BLOCKED until ${block.blockedUntil}`);
    } else {
        console.log("❌ Not blocked yet.");
    }

    const emailCount = await EmailAction.countDocuments({ email: /final_test/ });
    console.log("\n[EmailAction Proof]");
    console.log(`Emails sent: ${emailCount}`);

    const user = await WebsiteUser.findOne({ email: "final_test_5@test.com" });
    console.log("\n[WebsiteUser Proof]");
    if (user) {
        console.log(`User: ${user.email}`);
        console.log(`AttackCount: ${user.attackCount}`);
        console.log(`AttackTypes: ${user.attackTypes.join(", ")}`);
    }

    await slConnection.close();
}

run();
