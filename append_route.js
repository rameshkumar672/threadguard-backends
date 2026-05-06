const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'securityRoutes.js');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('/explain-attack/:logId')) {
        // Replace the module.exports line to insert the route just above it
        content = content.replace(
            'module.exports = router;',
            'router.get("/explain-attack/:logId", jwtAuth, getAIExplanation);\n\nmodule.exports = router;'
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Route added successfully to securityRoutes.js');
    } else {
        console.log('ℹ️ Route already exists in securityRoutes.js');
    }
} catch (err) {
    console.error('❌ Error updating routes:', err);
    process.exit(1);
}
