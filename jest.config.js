module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  verbose: true,
  testMatch: ['**/tests/**/*.test.js'],
  // Configure Puppeteer
  globals: {
    page: true,
    browser: true,
    context: true,
    jestPuppeteer: {
      launch: {
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    }
  }
}; 