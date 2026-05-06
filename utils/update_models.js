const fs = require("fs");
const path = require("path");

const modelsDir = path.join(__dirname, "..", "models");

const updates = [
  { file: "User.js", conn: "tgConnection" },
  { file: "Website.js", conn: "tgConnection" },
  { file: "AttackLog.js", conn: "slConnection" },
  { file: "blockedIP.js", conn: "slConnection" },
  { file: "EmailAction.js", conn: "slConnection" },
];

updates.forEach((u) => {
  const filePath = path.join(modelsDir, u.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${u.file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, "utf8");

  // 1. Add connection import
  if (!content.includes(`const { ${u.conn} } = require("../config/db");`)) {
    content = content.replace(
      'const mongoose = require("mongoose");',
      `const mongoose = require("mongoose");\nconst { ${u.conn} } = require("../config/db");`
    );
  }

  // 2. Update model binding
  content = content.replace(
    /module\.exports\s*=\s*mongoose\.model\s*\(/g,
    `module.exports = ${u.conn}.model(`
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Updated: ${u.file} -> ${u.conn}`);
});
