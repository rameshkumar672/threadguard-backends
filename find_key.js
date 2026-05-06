const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function findApiKey() {
    try {
        const tgConnection = mongoose.createConnection(process.env.MONGO_URI, {
            dbName: "threatguard"
        });
        await new Promise(resolve => tgConnection.on("connected", resolve));
        
        const Website = tgConnection.model("Website", new mongoose.Schema({ apiKey: String, status: String, websiteUrl: String }), "websites");
        const website = await Website.findOne({ status: "active" });
        
        if (website) {
            console.log("API_KEY=" + website.apiKey);
            console.log("URL=" + website.websiteUrl);
        } else {
            console.log("No active website found.");
        }
        
        await tgConnection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findApiKey();
