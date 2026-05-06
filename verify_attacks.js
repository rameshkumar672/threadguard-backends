const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const API_KEY = "TG_e5dcb003306d6108cc9eeabc44193095cc425b582855bb07";
const BASE_URL = "http://localhost:5000/api/protect/login-attempt";

async function runTests() {
    console.log("🚀 Starting Verification Tests...");

    // Test 1: Brute Force (5 attempts, same email)
    console.log("\n--- TEST 1: Brute Force Separation ---");
    const test1Ip = "1.1.1.1";
    const test1Email = "rahul@gmail.com";
    for (let i = 0; i < 5; i++) {
        await axios.post(BASE_URL, {
            email: test1Email,
            ip: test1Ip,
            status: "failed",
            name: "Rahul"
        }, { headers: { "x-api-key": API_KEY } });
        process.stdout.write(".");
    }
    console.log("\n✅ Sent 5 requests for " + test1Email);

    // Test 2: Credential Stuffing (5 unique emails)
    console.log("\n--- TEST 2: Credential Stuffing Detection ---");
    const test2Ip = "2.2.2.2";
    const test2Emails = [
        "rahul_cs@gmail.com",
        "aman_cs@gmail.com",
        "priya_cs@gmail.com",
        "rohit_cs@gmail.com",
        "sita_cs@gmail.com"
    ];
    for (const email of test2Emails) {
        await axios.post(BASE_URL, {
            email: email,
            ip: test2Ip,
            status: "failed",
            name: email.split("@")[0]
        }, { headers: { "x-api-key": API_KEY } });
        process.stdout.write(".");
    }
    console.log("\n✅ Sent 5 unique emails from " + test2Ip);

    // Test 4: IP Block (15 unique emails)
    console.log("\n--- TEST 4: IP Block ---");
    const test4Ip = "4.4.4.4";
    for (let i = 1; i <= 15; i++) {
        await axios.post(BASE_URL, {
            email: `user${i}@test.com`,
            ip: test4Ip,
            status: "failed",
            name: `User ${i}`
        }, { headers: { "x-api-key": API_KEY } });
        process.stdout.write(".");
    }
    console.log("\n✅ Sent 15 unique emails from " + test4Ip);

    console.log("\n\n📊 Fetching MongoDB Proofs...");
    await showProofs();
}

async function showProofs() {
    const slConnection = mongoose.createConnection(process.env.MONGO_URI, {
        dbName: "smartlogin"
    });
    await new Promise(resolve => slConnection.on("connected", resolve));

    const AttackLog = slConnection.model("AttackLog", new mongoose.Schema({}, { strict: false }), "attacklogs");
    const EmailAction = slConnection.model("EmailAction", new mongoose.Schema({}, { strict: false }), "emailactions");
    const BlockedIP = slConnection.model("BlockedIP", new mongoose.Schema({}, { strict: false }), "blockedips");
    const WebsiteUser = slConnection.model("WebsiteUser", new mongoose.Schema({}, { strict: false }), "websiteusers");

    // Proof 1
    console.log("\n[PROOF 1: Brute Force Separation (IP 1.1.1.1)]");
    const log1 = await AttackLog.findOne({ ip: "1.1.1.1" }).sort({ createdAt: -1 });
    console.log(JSON.stringify({
        ip: log1.ip,
        email: log1.email,
        attackType: log1.attackType,
        severity: log1.severity
    }, null, 2));

    // Proof 2
    console.log("\n[PROOF 2: Credential Stuffing (IP 2.2.2.2)]");
    const log2 = await AttackLog.findOne({ ip: "2.2.2.2" }).sort({ createdAt: -1 });
    console.log(JSON.stringify({
        ip: log2.ip,
        attackType: log2.attackType,
        severity: log2.severity,
        reason: log2.reason,
        actionTaken: log2.actionTaken
    }, null, 2));

    // Proof 3
    console.log("\n[PROOF 3: Email Alerts (Unique entries for IP 2.2.2.2)]");
    const emails = await EmailAction.find({ ip: "2.2.2.2" }); // Wait, EmailAction might not have IP
    // Let's find by emails targeted
    const emailsTargeted = [
        "rahul_cs@gmail.com",
        "aman_cs@gmail.com",
        "priya_cs@gmail.com",
        "rohit_cs@gmail.com",
        "sita_cs@gmail.com"
    ];
    const emailProofs = await EmailAction.find({ email: { $in: emailsTargeted } });
    console.log("Total EmailAlerts sent for CS test:", emailProofs.length);
    emailProofs.forEach(e => console.log(` - Sent to: ${e.email} (Type: ${e.actionType})`));

    // Proof 4
    console.log("\n[PROOF 4: IP Block (IP 4.4.4.4)]");
    const block = await BlockedIP.findOne({ ip: "4.4.4.4" });
    if (block) {
        console.log(JSON.stringify({
            ip: block.ip,
            reason: block.reason,
            blockedUntil: block.blockedUntil
        }, null, 2));
    } else {
        console.log("❌ No block found for 4.4.4.4");
    }

    // Proof 5
    console.log("\n[PROOF 5: WebsiteUser Tracking (Check sita_cs@gmail.com)]");
    const user = await WebsiteUser.findOne({ email: "sita_cs@gmail.com" });
    if (user) {
        console.log(JSON.stringify({
            email: user.email,
            attackCount: user.attackCount,
            attackTypes: user.attackTypes,
            attackLocations: user.attackLocations
        }, null, 2));
    }

    await slConnection.close();
}

runTests().catch(err => {
    console.error(err.message);
    process.exit(1);
});
