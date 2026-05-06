const { tgConnection } = require('./config/db');
const Owner = require('./models/threatguard/Owner');

async function showDb() {
  // Wait a bit for connection
  await new Promise(r => setTimeout(r, 2000));
  const docs = await Owner.find().sort({ createdAt: -1 }).limit(1);
  console.log("--- MongoDB User Document Proof ---");
  console.log(JSON.stringify(docs[0], null, 2));
  process.exit(0);
}

showDb();
