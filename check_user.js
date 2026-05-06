const mongoose = require('mongoose');
require('dotenv').config();
const { tgConnection } = require('./config/db');
const Owner = require('./models/threatguard/Owner');

async function checkRecord() {
    try {
        const email = 'rameshkk01324@gmail.com';
        // Wait for connection
        await new Promise((resolve) => {
            if (tgConnection.readyState === 1) resolve();
            else tgConnection.once('connected', resolve);
        });

        const owner = await Owner.findOne({ email: email.toLowerCase().trim() });
        
        if (owner) {
            console.log('Record found:');
            console.log(JSON.stringify(owner, null, 2));
        } else {
            console.log('Record NOT found for email:', email);
        }
    } catch (err) {
        console.error('Error checking record:', err);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
}

checkRecord();
