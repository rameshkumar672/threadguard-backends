const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function checkCollection() {
    const slConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: "smartlogin" });
    await new Promise(resolve => slConnection.on("connected", resolve));
    
    const collection = slConnection.collection("blockedips");
    const docs = await collection.find({}).toArray();
    console.log("Total docs in blockedips:", docs.length);
    docs.forEach(d => console.log(JSON.stringify(d)));
    
    await slConnection.close();
}

checkCollection();
