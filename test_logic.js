const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

async function test() {
    try {
        const tgConnection = mongoose.createConnection(process.env.MONGO_URI, {
            dbName: "threatguard"
        });

        await new Promise(resolve => tgConnection.on("connected", resolve));
        console.log("✅ Connected");

        const ownerSchema = new mongoose.Schema({
            email: String,
            password: String
        });
        const Owner = tgConnection.model("Owner", ownerSchema, "owners");

        const email = "test_logic_" + Date.now() + "@gmail.com";
        const password = "password123";

        // 1. Register
        const hash = await bcrypt.hash(password, 10);
        await Owner.create({ email, password: hash });
        console.log("✅ Registered " + email);

        // 2. Login
        const user = await Owner.findOne({ email });
        if (!user) {
            console.log("❌ User not found after registration!");
            process.exit(1);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            console.log("✅ Login success for new user!");
        } else {
            console.log("❌ Login failed for new user! Bcrypt mismatch.");
        }

        await tgConnection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
