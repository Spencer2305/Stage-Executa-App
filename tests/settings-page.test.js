const puppeteer = require('puppeteer');

describe('AI Assistant Settings Page Tests', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:3001';
  
  // Test data
  const testSettings = {
    name: 'Test Assistant Updated',
    description: 'Updated description for testing',
    welcomeMessage: 'Hello! This is an updated welcome message.',
    systemInstructions: 'You are a helpful test assistant. Be concise and friendly.',
    status: 'active'
  };

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 100, // Slow down for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Mock authentication
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('executa-auth-token', 'mock-jwt-token-for-testing');
    });
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Settings Form Interactions', () => {
    test('should load settings page and display form fields', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      
      // Wait for page to load and click settings tab
      await page.waitForSelector('[data-value="settings"]');
      await page.click('[data-value="settings"]');
      
      // Verify all main form sections are present
      await page.waitForSelector('input[placeholder="Enter assistant name"]');
      await page.waitForSelector('textarea[placeholder="Describe what your assistant does"]');
      await page.waitForSelector('textarea[placeholder="The first message users see"]');
      await page.waitForSelector('textarea[placeholder="Define how your assistant should behave"]');
      
      // Take screenshot for visual testing
      await page.screenshot({ path: 'tests/screenshots/settings-form-loaded.png' });
    });

    test('should fill out and save basic information', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      await page.waitForSelector('input[placeholder="Enter assistant name"]');
      
      // Fill out basic information
      await page.fill('input[placeholder="Enter assistant name"]', testSettings.name);
      await page.fill('textarea[placeholder="Describe what your assistant does"]', testSettings.description);
      await page.fill('textarea[placeholder="The first message users see"]', testSettings.welcomeMessage);
      
      // Select status
      await page.selectOption('select', testSettings.status);
      
      // Intercept the save request
      let saveRequestData = null;
      await page.route('**/api/models/*/settings', route => {
        saveRequestData = route.request().postData();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Settings saved' })
        });
      });
      
      // Click save button
      await page.click('button:has-text("Save Changes")');
      
      // Wait for success message
      await page.waitForSelector('text=Settings saved successfully!');
      
      // Verify the request was made with correct data
      expect(saveRequestData).toContain(testSettings.name);
      expect(saveRequestData).toContain(testSettings.description);
    });

    test('should update system instructions', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      
      // Wait for system instructions textarea
      await page.waitForSelector('textarea[placeholder="Define how your assistant should behave"]');
      
      // Fill system instructions
      await page.fill(
        'textarea[placeholder="Define how your assistant should behave"]', 
        testSettings.systemInstructions
      );
      
      // Mock successful save
      await page.route('**/api/models/*/settings', route => {
        const requestData = JSON.parse(route.request().postData());
        expect(requestData.behavior.systemInstructions).toBe(testSettings.systemInstructions);
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      await page.click('button:has-text("Save Changes")');
      await page.waitForSelector('text=Settings saved successfully!');
    });
  });

  describe('Advanced Settings', () => {
    test('should adjust temperature slider', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      
      // Wait for advanced settings section
      await page.waitForSelector('input[type="range"][min="0"][max="1"]');
      
      // Adjust temperature slider
      const temperatureSlider = await page.$('input[type="range"][min="0"][max="1"]');
      await temperatureSlider.click(); // Focus the slider
      
      // Set to 0.8
      await page.evaluate(() => {
        const slider = document.querySelector('input[type="range"][min="0"][max="1"]');
        slider.value = '0.8';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      // Verify the value display updated
      await page.waitForFunction(() => {
        const display = document.querySelector('span.text-sm.text-gray-500.w-8');
        return display && display.textContent === '0.8';
      });
    });

    test('should handle max tokens selection', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      
      // Wait for max tokens dropdown
      await page.waitForSelector('select[value="500"]');
      
      // Select different max tokens value
      await page.selectOption('select[value="500"]', '1000');
      
      // Verify selection
      const selectedValue = await page.$eval('select[value="500"]', el => el.value);
      expect(selectedValue).toBe('1000');
    });
  });

  describe('Error Handling', () => {
    test('should show error message when save fails', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      
      // Mock failed save request
      await page.route('**/api/models/*/settings', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database error' })
        });
      });
      
      // Try to save
      await page.click('button:has-text("Save Changes")');
      
      // Wait for error message
      await page.waitForSelector('text=Failed to save settings');
    });

    test('should handle authentication errors', async () => {
      // Clear auth token
      await page.evaluate(() => {
        localStorage.removeItem('executa-auth-token');
      });
      
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      
      // Should redirect to login or show auth error
      await page.waitForSelector('text=Authentication required', { timeout: 5000 });
    });
  });

  describe('Persistence Testing', () => {
    test('should reload settings after save', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      
      // Mock the assistant data with saved settings
      await page.route('**/api/models/test-assistant-id', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-assistant-id',
            name: testSettings.name,
            description: testSettings.description,
            instructions: testSettings.systemInstructions,
            welcomeMessage: testSettings.welcomeMessage,
            status: 'ACTIVE'
          })
        });
      });
      
      // Reload the page
      await page.reload();
      await page.click('[data-value="settings"]');
      
      // Verify settings are loaded
      await page.waitForSelector('input[placeholder="Enter assistant name"]');
      
      const nameValue = await page.$eval('input[placeholder="Enter assistant name"]', el => el.value);
      const descValue = await page.$eval('textarea[placeholder="Describe what your assistant does"]', el => el.value);
      
      expect(nameValue).toBe(testSettings.name);
      expect(descValue).toBe(testSettings.description);
    });
  });

  describe('Handoff Settings', () => {
    test('should toggle handoff settings', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      
      // Find and click handoff enable checkbox
      await page.waitForSelector('input[type="checkbox"]');
      const handoffCheckbox = await page.$('input[type="checkbox"]');
      await handoffCheckbox.click();
      
      // Verify handoff settings section appears
      await page.waitForSelector('.handoff-settings', { timeout: 3000 });
    });
  });

  describe('Visual Regression Testing', () => {
    test('should match visual snapshots', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      
      // Wait for page to fully load
      await page.waitForSelector('button:has-text("Save Changes")');
      await page.waitForTimeout(1000); // Allow animations to complete
      
      // Take full page screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/settings-page-full.png',
        fullPage: true 
      });
      
      // Take specific sections
      const basicInfoSection = await page.$('text=Basic Information');
      await basicInfoSection.screenshot({ path: 'tests/screenshots/basic-info-section.png' });
      
      const behaviorSection = await page.$('text=AI Behavior & Personality');
      await behaviorSection.screenshot({ path: 'tests/screenshots/behavior-section.png' });
    });
  });

  describe('Performance Testing', () => {
    test('should load settings page within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      await page.waitForSelector('button:has-text("Save Changes")');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle multiple rapid saves gracefully', async () => {
      await page.goto(`${BASE_URL}/dashboard/assistants/test-assistant-id`);
      await page.click('[data-value="settings"]');
      
      await page.waitForSelector('input[placeholder="Enter assistant name"]');
      
      // Mock delayed save responses
      let saveCount = 0;
      await page.route('**/api/models/*/settings', route => {
        saveCount++;
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        }, 1000);
      });
      
      // Click save multiple times rapidly
      const saveButton = await page.$('button:has-text("Save Changes")');
      await saveButton.click();
      await saveButton.click();
      await saveButton.click();
      
      // Should only make one request (button should be disabled)
      await page.waitForTimeout(2000);
      expect(saveCount).toBe(1);
    });
  });
});

// Helper functions
async function loginAsTestUser(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testpassword');
  await page.click('button:has-text("Sign In")');
  await page.waitForSelector('text=Dashboard');
}

async function createTestAssistant(page) {
  await page.goto(`${BASE_URL}/dashboard/create`);
  await page.fill('input[placeholder="Assistant name"]', 'Test Assistant');
  await page.click('button:has-text("Create Assistant")');
  await page.waitForSelector('text=Assistant created successfully');
} 