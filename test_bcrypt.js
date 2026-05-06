const bcrypt = require('bcryptjs');

async function testBcrypt() {
    const password = 'Password123!';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    const isMatch = await bcrypt.compare(password, hash);
    console.log('Match:', isMatch);
}

testBcrypt();
