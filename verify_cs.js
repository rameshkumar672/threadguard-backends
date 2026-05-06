const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const API_KEY = "TG_e5dcb003306d6108cc9eeabc44193095cc425b582855bb07";
const BASE_URL = "http://localhost:5000/api/protect/login-attempt";

async function runTests() {
    console.log("🚀 Starting Verification Test 2...");

    // Test 2: Credential Stuffing (5 unique emails)
    const test2Ip = "2.2.2.3";
    const test2Emails = [
        "rahul_cs@gmail.com",
        "aman_cs@gmail.com",
        "priya_cs@gmail.com",
        "rohit_cs@gmail.com",
        "sita_cs@gmail.com"
    ];
    for (const email of test2Emails) {
        try {
            await axios.post(BASE_URL, {
                email: email,
                ip: test2Ip,
                status: "failed",
                name: email.split("@")[0]
            }, { headers: { "x-api-key": API_KEY } });
            process.stdout.write(".");
        } catch (err) {
            console.error("\n❌ Error on email " + email + ": " + (err.response?.data?.message || err.message));
        }
    }
    console.log("\n✅ Sent 5 unique emails from " + test2Ip);

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
    const WebsiteUser = slConnection.model("WebsiteUser", new mongoose.Schema({}, { strict: false }), "websiteusers");

    // Proof 2
    console.log("\n[PROOF 2: Credential Stuffing (IP 2.2.2.3)]");
    const logs = await AttackLog.find({ ip: "2.2.2.3" }).sort({ createdAt: -1 }).limit(1);
    if (logs.length > 0) {
        const log = logs[0];
        console.log(JSON.stringify({
            ip: log.ip,
            attackType: log.attackType,
            severity: log.severity,
            reason: log.reason,
            actionTaken: log.actionTaken
        }, null, 2));
    }

    // Proof 3
    console.log("\n[PROOF 3: Email Alerts (Unique entries)]");
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
