const mongoose = require('mongoose');
require('dotenv').config();
const { tgConnection } = require('./config/db');

async function listCollections() {
    try {
        await new Promise((resolve) => {
            if (tgConnection.readyState === 1) resolve();
            else tgConnection.once('connected', resolve);
        });

        const admin = tgConnection.db.admin();
        const info = await tgConnection.db.listCollections().toArray();
        console.log('Collections in ThreatGuard DB:');
        info.forEach(c => console.log(' -', c.name));

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
}

listCollections();
