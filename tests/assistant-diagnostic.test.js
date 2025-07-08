const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try {
              return JSON.parse(data);
            } catch (e) {
              return null;
            }
          }
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

describe('Assistant Diagnostic Tests', () => {
  const baseUrl = 'localhost';
  const port = 3000;
  const problemAssistantId = 'cmcp6yteb0004y996dankoslh'; // From your error
  
  test('should diagnose the problematic assistant', async () => {
    console.log('🔍 Diagnosing assistant:', problemAssistantId);
    
    try {
      // First, let's try to get the assistant details through the API
      const response = await makeRequest({
        hostname: baseUrl,
        port: port,
        path: `/api/models/${problemAssistantId}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // This will fail auth but tell us about the assistant
        },
        timeout: 10000
      });
      
      console.log('📊 Assistant API status:', response.statusCode);
      
      if (response.statusCode === 401) {
        console.log('🔒 Authentication required (expected) - assistant endpoint exists');
      } else if (response.statusCode === 404) {
        console.log('🚫 Assistant not found in database');
      } else if (response.statusCode === 500) {
        console.log('⚠️ Server error - let\'s see the details');
        console.log('📄 Error response:', response.body.substring(0, 500));
      }
      
      // Now let's test the chat endpoint that's actually failing
      const chatResponse = await makeRequest({
        hostname: baseUrl,
        port: port,
        path: `/api/chat/${problemAssistantId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }, JSON.stringify({
        message: 'Hello test message',
        threadId: null,
        sessionId: 'test-session',
        userIdentifier: 'test-user'
      }));
      
      console.log('💬 Chat API status:', chatResponse.statusCode);
      console.log('📄 Chat response:', chatResponse.body.substring(0, 500));
      
      const chatJson = chatResponse.json();
      if (chatJson && chatJson.error) {
        console.log('❌ Chat error details:', chatJson.error);
        if (chatJson.details) {
          console.log('📝 Additional details:', chatJson.details);
        }
        
        if (chatJson.error === 'Assistant not properly configured' && 
            chatJson.details === 'OpenAI assistant ID missing') {
          console.log('🎯 FOUND THE ISSUE: Assistant is missing openaiAssistantId');
          console.log('💡 This means the assistant was created in the database but the OpenAI integration failed');
        }
      }
      
      expect(chatResponse.statusCode).toBeDefined();
      console.log('✅ Diagnostic completed');
      
    } catch (error) {
      console.error('❌ Diagnostic test failed:', error.message);
      throw error;
    }
  });

  test('should check assistant list endpoint', async () => {
    console.log('📋 Checking assistants list endpoint...');
    
    try {
      const response = await makeRequest({
        hostname: baseUrl,
        port: port,
        path: '/api/assistants',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        timeout: 10000
      });
      
      console.log('📊 Assistants list status:', response.statusCode);
      
      if (response.statusCode === 401) {
        console.log('🔒 Authentication required for assistants list (expected)');
      } else if (response.statusCode === 200) {
        const data = response.json();
        if (data && data.assistants) {
          console.log(`📋 Found ${data.assistants.length} assistants in the system`);
          const problemAssistant = data.assistants.find(a => a.id === problemAssistantId);
          if (problemAssistant) {
            console.log('🎯 Found the problematic assistant in the list:');
            console.log('   Name:', problemAssistant.name);
            console.log('   Status:', problemAssistant.status);
            console.log('   Created:', problemAssistant.createdAt);
          } else {
            console.log('🔍 Problematic assistant not found in user\'s assistant list');
          }
        }
      }
      
      console.log('✅ Assistants list check completed');
      
    } catch (error) {
      console.error('❌ Assistants list check failed:', error.message);
      throw error;
    }
  });

  test('should test assistant creation endpoint', async () => {
    console.log('🧪 Testing assistant creation endpoint...');
    
    try {
      const response = await makeRequest({
        hostname: baseUrl,
        port: port,
        path: '/api/test-assistant',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        timeout: 30000 // Longer timeout for this test
      });
      
      console.log('📊 Test assistant creation status:', response.statusCode);
      
      if (response.statusCode === 401) {
        console.log('🔒 Authentication required for test endpoint (expected)');
      } else if (response.statusCode === 200) {
        const data = response.json();
        console.log('✅ Assistant creation test passed:', data.message);
        if (data.tests) {
          data.tests.forEach(test => console.log('   -', test));
        }
      } else {
        console.log('📄 Test response:', response.body.substring(0, 500));
      }
      
      console.log('✅ Assistant creation test completed');
      
    } catch (error) {
      console.error('❌ Assistant creation test failed:', error.message);
      throw error;
    }
  });

  test('should provide fix recommendations', async () => {
    console.log('💡 Generating fix recommendations...');
    
    console.log('');
    console.log('🔧 DIAGNOSIS SUMMARY:');
    console.log('====================================');
    console.log('Assistant ID:', problemAssistantId);
    console.log('Error: "Assistant not properly configured"');
    console.log('Root Cause: Missing openaiAssistantId field');
    console.log('');
    console.log('🛠️ RECOMMENDED FIXES:');
    console.log('1. Delete the broken assistant and create a new one');
    console.log('2. Or manually fix the assistant by running a database migration');
    console.log('3. Check server logs for OpenAI API errors during assistant creation');
    console.log('');
    console.log('🚀 IMMEDIATE STEPS:');
    console.log('1. Go to your dashboard: http://localhost:3000/dashboard');
    console.log('2. Navigate to "My AIs" section');
    console.log('3. Delete the assistant named "My AI ijjj"');
    console.log('4. Create a new assistant with the same name and upload your files again');
    console.log('');
    console.log('🔍 DEBUGGING STEPS:');
    console.log('1. Check server logs when creating assistants');
    console.log('2. Verify OpenAI API key is configured properly');
    console.log('3. Ensure OpenAI quota is not exceeded');
    console.log('');
    
    expect(true).toBeTruthy(); // This test always passes, it's just for displaying info
  });
}); 