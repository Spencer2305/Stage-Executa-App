// Global test setup for Puppeteer tests
const { mkdir } = require('fs').promises;
const path = require('path');

beforeAll(async () => {
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  try {
    await mkdir(screenshotsDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
});

// Global timeout for all tests
jest.setTimeout(30000);

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Set global test configuration
global.BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
global.IS_CI = process.env.CI === 'true';

// Mock authentication token for tests
global.MOCK_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJhY2NvdW50SWQiOiJ0ZXN0LWFjY291bnQtaWQiLCJpYXQiOjE2NzAwMDAwMDAsImV4cCI6MTY3MDAwMzYwMH0.test-signature';

// Console log capture for debugging
const originalConsoleError = console.error;
console.error = (...args) => {
  if (process.env.DEBUG_TESTS) {
    originalConsoleError.apply(console, args);
  }
}; 