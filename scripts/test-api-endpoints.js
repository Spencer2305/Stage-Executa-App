const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  email: 'api-test@example.com',
  password: 'TestPass123!',
  name: 'API Test User'
};

let authToken = null;

async function testApiEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test 1: Registration
    console.log('1️⃣ Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (registerResponse.status === 201) {
      console.log('✅ Registration successful');
      console.log(`   User ID: ${registerResponse.data.user.id}`);
      console.log(`   Email: ${registerResponse.data.user.email}`);
      authToken = registerResponse.data.token;
      console.log(`   Token received: ${authToken ? 'Yes' : 'No'}\n`);
    }

    // Test 2: Login
    console.log('2️⃣ Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      console.log(`   User ID: ${loginResponse.data.user.id}`);
      authToken = loginResponse.data.token;
      console.log(`   New token received: ${authToken ? 'Yes' : 'No'}\n`);
    }

    // Test 3: Get Current User (Protected Route)
    console.log('3️⃣ Testing protected route (/auth/me)...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (meResponse.status === 200) {
      console.log('✅ Protected route access successful');
      console.log(`   User: ${meResponse.data.user.name} (${meResponse.data.user.email})\n`);
    }

    // Test 4: Test Invalid Token
    console.log('4️⃣ Testing invalid token handling...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token properly rejected\n');
      } else {
        throw error;
      }
    }

    // Test 5: Test No Token
    console.log('5️⃣ Testing no token handling...');
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      console.log('❌ Should have failed with no token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ No token properly rejected\n');
      } else {
        throw error;
      }
    }

    // Test 6: Logout
    console.log('6️⃣ Testing logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (logoutResponse.status === 200) {
      console.log('✅ Logout successful\n');
    }

    // Test 7: Test Duplicate Registration
    console.log('7️⃣ Testing duplicate email registration...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('❌ Should have failed with duplicate email');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate email properly rejected\n');
      } else {
        throw error;
      }
    }

    // Test 8: Test Invalid Password
    console.log('8️⃣ Testing weak password validation...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'weak-password@example.com',
        password: '123',
        name: 'Weak Password User'
      });
      console.log('❌ Should have failed with weak password');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Weak password properly rejected');
        console.log(`   Error: ${error.response.data.error}\n`);
      } else {
        throw error;
      }
    }

    console.log('🎉 All API endpoint tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:3000');
    return true;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3000');
    console.log('   Please run: npm run dev');
    process.exit(1);
  }

  await testApiEndpoints();
}

runTests(); 