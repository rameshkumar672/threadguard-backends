const axios = require('axios');
const mongoose = require('mongoose');

const baseUrl = 'http://localhost:5000/api/threatguard';

async function runTests() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'TestPassword123';
  const name = 'Test Agent';

  console.log('--- TEST 5: Register new user ---');
  try {
    const res = await axios.post(`${baseUrl}/register`, { name, email, password });
    console.log('Registration Response:', res.data);
  } catch (err) {
    console.error('Registration failed:', err.response?.data || err.message);
    return;
  }

  console.log('\n--- TEST 1: Login with exact email/password ---');
  try {
    const res = await axios.post(`${baseUrl}/login`, { email, password });
    console.log('Login Response:', { message: res.data.message, token: res.data.token.substring(0, 20) + '...', user: res.data.user });
  } catch (err) {
    console.error('Test 1 failed:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 2: Login with uppercase letters ---');
  try {
    const uppercaseEmail = email.replace('test', 'TEST');
    const res = await axios.post(`${baseUrl}/login`, { email: uppercaseEmail, password });
    console.log(`Payload Email: ${uppercaseEmail}`);
    console.log('Login Response:', { message: res.data.message, token: res.data.token.substring(0, 20) + '...', user: res.data.user });
  } catch (err) {
    console.error('Test 2 failed:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 3: Login with trailing spaces ---');
  try {
    const spacedEmail = `   ${email}   `;
    const res = await axios.post(`${baseUrl}/login`, { email: spacedEmail, password });
    console.log(`Payload Email: '${spacedEmail}'`);
    console.log('Login Response:', { message: res.data.message, token: res.data.token.substring(0, 20) + '...', user: res.data.user });
  } catch (err) {
    console.error('Test 3 failed:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 4: Login with wrong password ---');
  try {
    const res = await axios.post(`${baseUrl}/login`, { email, password: 'WrongPassword' });
    console.log('Login Response (should not happen):', res.data);
  } catch (err) {
    console.error('Login Error Response (Expected):', err.response?.data || err.message);
  }
}

runTests();
