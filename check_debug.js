const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function checkLogs() {
    const slConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: "smartlogin" });
    await new Promise(resolve => slConnection.on("connected", resolve));
    const AttackLog = slConnection.model("AttackLog", new mongoose.Schema({}, { strict: false }), "attacklogs");
    const BlockedIP = slConnection.model("BlockedIP", new mongoose.Schema({}, { strict: false }), "blockedips");

    console.log("--- Attack Logs for 4.4.4.6 ---");
    const logs = await AttackLog.find({ ip: "4.4.4.6" }).sort({ createdAt: 1 });
    logs.forEach((l, i) => console.log(`${i+1}: ${l.email} -> ${l.attackType} (${l.actionTaken})`));

    console.log("\n--- Blocked IP check ---");
    const block = await BlockedIP.findOne({ ip: "4.4.4.6" });
    console.log(block ? "✅ Blocked" : "❌ Not Blocked");

    await slConnection.close();
}

checkLogs();
