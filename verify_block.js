const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const API_KEY = "TG_e5dcb003306d6108cc9eeabc44193095cc425b582855bb07";
const BASE_URL = "http://localhost:5000/api/protect/login-attempt";

async function runTests() {
    console.log("🚀 Starting IP Block Test...");
    const test4Ip = "4.4.4.9";
    for (let i = 1; i <= 15; i++) {
        try {
            await axios.post(BASE_URL, {
                email: `user_block_${i}@test.com`,
                ip: test4Ip,
                status: "failed",
                name: `User ${i}`
            }, { headers: { "x-api-key": API_KEY } });
            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 500)); // 0.5s delay
        } catch (err) {
            console.error("\n❌ Error on attempt " + i + ": " + (err.response?.data?.message || err.message));
        }
    }
    console.log("\n✅ Sent 15 unique emails from " + test4Ip);
    
    await showProofs();
}

async function showProofs() {
    const slConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: "smartlogin" });
    await new Promise(resolve => slConnection.on("connected", resolve));
    const BlockedIP = slConnection.model("BlockedIP", new mongoose.Schema({}, { strict: false }), "blockedips");
    
    console.log("\n[PROOF 4: IP Block (IP 4.4.4.8)]");
    const block = await BlockedIP.findOne({ ip: "4.4.4.8" });
    if (block) {
        console.log(JSON.stringify({
            ip: block.ip,
            reason: block.reason,
            blockedUntil: block.blockedUntil
        }, null, 2));
    } else {
        console.log("❌ No block found for 4.4.4.8");
    }
    await slConnection.close();
}

runTests();
