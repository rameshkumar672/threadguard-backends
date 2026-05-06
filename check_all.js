const mongoose = require('mongoose');
require('dotenv').config();
const { tgConnection, slConnection } = require('./config/db');
const Owner = require('./models/threatguard/Owner');
const User = require('./models/smartlogin/User');

async function checkAll() {
    try {
        const email = 'rameshkk01324@gmail.com';
        
        await Promise.all([
            new Promise(r => tgConnection.readyState === 1 ? r() : tgConnection.once('connected', r)),
            new Promise(r => slConnection.readyState === 1 ? r() : slConnection.once('connected', r))
        ]);

        console.log('--- Checking ThreatGuard.Owners ---');
        const owner = await Owner.findOne({ email: email.toLowerCase().trim() });
        if (owner) {
            console.log('Owner Found:', owner.email);
            console.log('Hash:', owner.password);
        } else {
            console.log('Owner NOT Found');
        }

        console.log('\n--- Checking SmartLogin.Users ---');
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            console.log('User Found:', user.email);
            console.log('Hash:', user.password);
        } else {
            console.log('User NOT Found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
}

checkAll();
