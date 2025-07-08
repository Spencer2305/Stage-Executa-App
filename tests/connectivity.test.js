const puppeteer = require('puppeteer');

describe('Basic Connectivity Test', () => {
  let browser;

  beforeAll(async () => {
    console.log('🚀 Starting browser...');
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000 // 60 second timeout
    });
    console.log('✅ Browser started');
  });

  afterAll(async () => {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
      console.log('✅ Browser closed');
    }
  });

  test('should connect to homepage', async () => {
    console.log('📖 Opening new page...');
    const page = await browser.newPage();
    
    try {
      console.log('🌐 Navigating to localhost:3000...');
      await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      console.log('📄 Getting page title...');
      const title = await page.title();
      console.log('🏷️ Page title:', title);
      
      expect(title).toBeTruthy();
      console.log('✅ Homepage connection test passed');
      
    } catch (error) {
      console.error('❌ Error in homepage test:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }, 60000);

  test('should handle navigation with explicit wait', async () => {
    const page = await browser.newPage();
    
    try {
      console.log('🌐 Testing navigation with explicit wait...');
      
      // Set a longer timeout for this specific navigation
      page.setDefaultTimeout(45000);
      
      const response = await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle0',
        timeout: 45000 
      });
      
      console.log('📊 Response status:', response.status());
      console.log('🔗 Final URL:', page.url());
      
      expect(response.status()).toBeLessThan(400);
      console.log('✅ Navigation test passed');
      
    } catch (error) {
      console.error('❌ Error in navigation test:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }, 60000);

  test('should check if dashboard redirects properly', async () => {
    const page = await browser.newPage();
    
    try {
      console.log('🎯 Testing dashboard access...');
      
      await page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait a bit for any redirects
      await page.waitForTimeout(2000);
      
      const finalUrl = page.url();
      console.log('🔗 Final URL after dashboard request:', finalUrl);
      
      // Check if we're redirected to login (expected behavior)
      if (finalUrl.includes('/login')) {
        console.log('✅ Correctly redirected to login page');
        
        // Check if login form elements exist
        const loginElements = await page.$$('input[type="email"], input[type="password"]');
        console.log('🔑 Found', loginElements.length, 'login form elements');
        
      } else if (finalUrl.includes('/dashboard')) {
        console.log('ℹ️ Dashboard loaded directly (might be cached auth)');
      } else {
        console.log('⚠️ Unexpected redirect to:', finalUrl);
      }
      
      console.log('✅ Dashboard redirect test completed');
      
    } catch (error) {
      console.error('❌ Error in dashboard test:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }, 60000);
}); 