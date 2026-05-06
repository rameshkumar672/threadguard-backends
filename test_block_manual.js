const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function testBlock() {
    const slConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: "smartlogin" });
    await new Promise(resolve => slConnection.on("connected", resolve));
    
    const BlockedIP = slConnection.model("BlockedIP", new mongoose.Schema({
        ownerId: mongoose.Schema.Types.ObjectId,
        websiteId: mongoose.Schema.Types.ObjectId,
        ip: String,
        reason: String,
        blockedUntil: Date
    }, { strict: false }), "blockedips");

    try {
        await BlockedIP.create({
            ip: "8.8.8.8",
            reason: "Test",
            ownerId: new mongoose.Types.ObjectId(),
            websiteId: new mongoose.Types.ObjectId(),
            blockedUntil: new Date()
        });
        console.log("✅ Success");
    } catch (err) {
        console.error("❌ Failed:", err.message);
    }
    await slConnection.close();
}

testBlock();
