const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AttackLog = require('../models/AttackLog');
const BlockedIP = require('../models/blockedIP');
const Website = require('../models/Website');
const { loginAttempt } = require('../controllers/protectionController');

dotenv.config();

async function runTest() {
  console.log('--- 🛡️ Starting System Verification Tests ---');

  try {
    // 1. Connect to DB (Wait for pools)
    const { tgConnection, slConnection } = require('../config/db');
    await Promise.all([
      new Promise(resolve => tgConnection.once('connected', resolve)),
      new Promise(resolve => slConnection.once('connected', resolve))
    ]);
    console.log('✅ Connected to both Databases');

    // 2. Setup/Find Mock Website
    let website = await Website.findOne({ domain: 'verify-test.com' });
    if (!website) {
      website = await Website.create({
        userId: new mongoose.Types.ObjectId(), // dummy
        siteName: 'Verification Test',
        domain: 'verify-test.com',
        apiKey: 'TG_verify_' + Math.random().toString(36).substring(7),
        verified: true,
        settings: { lockdownMode: false, rateLimitThreshold: 5 }
      });
      console.log('✅ Created Mock Website');
    } else {
      website.verified = true;
      website.settings = { lockdownMode: false, rateLimitThreshold: 5 };
      await website.save();
      console.log('✅ Updated Mock Website');
    }

    const testIP = '192.168.1.137';
    // Clear old logs for this IP before test
    await AttackLog.deleteMany({ ipAddress: testIP });
    await BlockedIP.deleteMany({ ipAddress: testIP });

    console.log('\n--- Test 1: Brute Force (5 Failures Same IP) ---');
    
    // Simulate 5 failures
    for (let i = 0; i < 5; i++) {
      const mockReq = {
        body: { email: 'admin@verify-test.com', status: 'failed', ip: testIP },
        website: website,
        headers: { 'user-agent': 'ThreatGuard-Verify-Agent' },
        app: { get: () => ({ emit: () => {} }) } // mock Socket IO
      };
      
      let resData = {};
      const mockRes = {
        status: (code) => ({ json: (d) => { resData = d; } }),
        json: (d) => { resData = d; }
      };

      await loginAttempt(mockReq, mockRes);
      console.log(` Attempt ${i+1}: ${resData.actionTaken || resData.message}`);
    }

    // Verify BlockedIP
    const lock = await BlockedIP.findOne({ ipAddress: testIP });
    if (lock) {
      console.log('✅ SUCCESS: IP quarantine list correctly isolated the threat.');
    } else {
      console.log('❌ FAILURE: IP quarantine list could not be verified.');
    }

    console.log('\n--- Test 2: Lockdown Mode ---');
    website.settings.lockdownMode = true;
    await website.save();

    const mockReqLock = {
      body: { email: 'user@verify-test.com', status: 'failed', ip: '1.1.1.1' },
      website: website,
      headers: { 'user-agent': 'ThreatGuard-Verify-Agent' },
      app: { get: () => null }
    };

    let resDataLock = {};
    const mockResLock = {
      status: (code) => ({ json: (d) => { resDataLock = d; } }),
      json: (d) => { resDataLock = d; }
    };

    await loginAttempt(mockReqLock, mockResLock);
    if (resDataLock.attackType === 'Lockdown Block') {
       console.log('✅ SUCCESS: Perimeter Lock intercepted the anomalous attempt correctly.');
    } else {
       console.log('❌ FAILURE: Perimeter Lock failed to engage.');
    }

  } catch (err) {
    console.error('❌ Error during verification:', err);
  } finally {
    const { tgConnection, slConnection } = require('../config/db');
    await Promise.all([tgConnection.close(), slConnection.close()]);
    console.log('\n--- 🏁 Verification Completed ---');
    process.exit(0);
  }
}

runTest();
