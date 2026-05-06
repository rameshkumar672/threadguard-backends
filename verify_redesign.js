const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

const BASE_URL = "http://localhost:5000/api/protect";
const API_KEY = "dummy_verified_key"; // We might need a real API key from DB for verify

const runTest = async () => {
    console.log("--- 🛡️ Verifying Architecture Redesign & Scanner ---");

    try {
        const { tgConnection, slConnection } = require("./config/db");
        await Promise.all([
          new Promise(r => tgConnection.once("connected", r)),
          new Promise(r => slConnection.once("connected", r))
        ]);

        const Website = require("./models/Website");
        let website = await Website.findOne({ domain: "verify-test.com" });
        if (!website) {
            website = await Website.create({
                userId: new mongoose.Types.ObjectId(),
                siteName: "Verify Test",
                domain: "verify-test.com",
                apiKey: "verify_apikey_124",
                verified: true
            });
        }

        console.log(`✅ Using Website with API Key: ${website.apiKey}`);

        // Fire Malicious Attack SQL Injection
        console.log("\n1. 🚨 Firing SQL Injection Malicious Request...");
        try {
            await axios.post(`${BASE_URL}/login`, {
                 email: "attacker@test.com",
                 password: "' OR 1=1 -- malicious",
            }, {
                headers: { "x-api-key": website.apiKey }
            });
        } catch (err) {
            console.log(`✅ Intercepted Request Response: ${err.response?.data?.message || err.message}`);
        }

        // Verify smartlogin DB
        const AttackLog = require("./models/AttackLog");
        const log = await AttackLog.findOne({ type: "sql_injection" });
        if (log) {
            console.log(`✅ Attack Log stored properly inside SmartLogin: Type=${log.type}, Severity=${log.severity}`);
        } else {
            console.log("❌ Failure: Attack log not found.");
        }

    } catch (err) {
        console.error("❌ Test script error:", err);
    } finally {
        const { tgConnection, slConnection } = require("./config/db");
        await Promise.all([tgConnection.close(), slConnection.close()]);
        process.exit(0);
    }
};

runTest();
