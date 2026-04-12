const { chromium } = require('playwright');

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'https://localhost:5174',
  graphqlUrl: 'http://localhost:4001/graphql',
  testUser: {
    email: 'shareef.hiasat@gmail.com',
    password: 'your-password' // We'll need to handle Keycloak auth
  },
  testData: {
    program: {
      nameEn: 'Test Program TDD',
      nameAr: 'برنامج اختبار',
      code: 'TDD-001',
      descriptionEn: 'Test program for TDD',
      descriptionAr: 'برنامج اختبار للتطوير المدفوع بالاختبارات'
    },
    subject: {
      nameEn: 'Test Subject TDD',
      nameAr: 'مادة اختبار',
      code: 'TDD-SUB-001',
      descriptionEn: 'Test subject for TDD',
      descriptionAr: 'مادة اختبار للتطوير المدفوع بالاختبارات'
    },
    class: {
      name: 'Test Class TDD',
      nameAr: 'فصل اختبار',
      code: 'TDD-CLASS-001',
      term: 'Fall',
      year: '2024',
      locationEn: 'Test Location',
      locationAr: 'موقع الاختبار'
    }
  }
};

// Test Functions
async function testProgramCRUD(page) {
  console.log('🧪 Testing Program CRUD...');
  
  // Navigate to programs page
  await page.goto(`${TEST_CONFIG.baseUrl}/dashboard?tab=programs`);
  await page.waitForLoadState('networkidle');
  
  // Create Program
  await page.click('[data-testid="add-program-btn"]');
  await page.fill('[data-testid="program-name-en"]', TEST_CONFIG.testData.program.nameEn);
  await page.fill('[data-testid="program-name-ar"]', TEST_CONFIG.testData.program.nameAr);
  await page.fill('[data-testid="program-code"]', TEST_CONFIG.testData.program.code);
  await page.fill('[data-testid="program-description-en"]', TEST_CONFIG.testData.program.descriptionEn);
  await page.fill('[data-testid="program-description-ar"]', TEST_CONFIG.testData.program.descriptionAr);
  await page.click('[data-testid="save-program-btn"]');
  
  // Wait for success and capture logs
  await page.waitForTimeout(2000);
  
  // Edit Program
  await page.click('[data-testid="edit-program-btn"]:first-child');
  await page.fill('[data-testid="program-name-en"]', TEST_CONFIG.testData.program.nameEn + ' Updated');
  await page.click('[data-testid="save-program-btn"]');
  await page.waitForTimeout(2000);
  
  // Delete Program
  await page.click('[data-testid="edit-program-btn"]:first-child');
  await page.click('[data-testid="delete-program-btn"]');
  await page.click('[data-testid="confirm-delete-btn"]');
  await page.waitForTimeout(2000);
  
  console.log('✅ Program CRUD test completed');
}

async function testSubjectCRUD(page) {
  console.log('🧪 Testing Subject CRUD...');
  
  // Navigate to subjects page
  await page.goto(`${TEST_CONFIG.baseUrl}/dashboard?tab=subjects`);
  await page.waitForLoadState('networkidle');
  
  // Create Subject
  await page.click('[data-testid="add-subject-btn"]');
  await page.fill('[data-testid="subject-name-en"]', TEST_CONFIG.testData.subject.nameEn);
  await page.fill('[data-testid="subject-name-ar"]', TEST_CONFIG.testData.subject.nameAr);
  await page.fill('[data-testid="subject-code"]', TEST_CONFIG.testData.subject.code);
  await page.fill('[data-testid="subject-description-en"]', TEST_CONFIG.testData.subject.descriptionEn);
  await page.fill('[data-testid="subject-description-ar"]', TEST_CONFIG.testData.subject.descriptionAr);
  await page.click('[data-testid="save-subject-btn"]');
  
  await page.waitForTimeout(2000);
  
  // Edit Subject
  await page.click('[data-testid="edit-subject-btn"]:first-child');
  await page.fill('[data-testid="subject-name-en"]', TEST_CONFIG.testData.subject.nameEn + ' Updated');
  await page.click('[data-testid="save-subject-btn"]');
  await page.waitForTimeout(2000);
  
  // Delete Subject
  await page.click('[data-testid="edit-subject-btn"]:first-child');
  await page.click('[data-testid="delete-subject-btn"]');
  await page.click('[data-testid="confirm-delete-btn"]');
  await page.waitForTimeout(2000);
  
  console.log('✅ Subject CRUD test completed');
}

async function testClassCRUD(page) {
  console.log('🧪 Testing Class CRUD...');
  
  // Navigate to classes page
  await page.goto(`${TEST_CONFIG.baseUrl}/dashboard?tab=classes`);
  await page.waitForLoadState('networkidle');
  
  // Create Class
  await page.click('[data-testid="add-class-btn"]');
  await page.fill('[data-testid="class-name"]', TEST_CONFIG.testData.class.name);
  await page.fill('[data-testid="class-name-ar"]', TEST_CONFIG.testData.class.nameAr);
  await page.fill('[data-testid="class-code"]', TEST_CONFIG.testData.class.code);
  await page.selectOption('[data-testid="class-term"]', TEST_CONFIG.testData.class.term);
  await page.selectOption('[data-testid="class-year"]', TEST_CONFIG.testData.class.year);
  await page.fill('[data-testid="class-location-en"]', TEST_CONFIG.testData.class.locationEn);
  await page.fill('[data-testid="class-location-ar"]', TEST_CONFIG.testData.class.locationAr);
  await page.click('[data-testid="save-class-btn"]');
  
  await page.waitForTimeout(2000);
  
  // Edit Class
  await page.click('[data-testid="edit-class-btn"]:first-child');
  await page.fill('[data-testid="class-name"]', TEST_CONFIG.testData.class.name + ' Updated');
  await page.click('[data-testid="save-class-btn"]');
  await page.waitForTimeout(2000);
  
  // Delete Class
  await page.click('[data-testid="edit-class-btn"]:first-child');
  await page.click('[data-testid="delete-class-btn"]');
  await page.click('[data-testid="confirm-delete-btn"]');
  await page.waitForTimeout(2000);
  
  console.log('✅ Class CRUD test completed');
}

// Console Log Monitor
class ConsoleLogMonitor {
  constructor() {
    this.logs = [];
    this.issues = [];
  }

  async startMonitoring(page) {
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      };
      
      this.logs.push(logEntry);
      
      // Check for specific issues
      if (msg.text().includes('ERROR') || msg.text().includes('error')) {
        this.issues.push({
          type: 'ERROR',
          message: msg.text(),
          timestamp: logEntry.timestamp
        });
        console.log(`🚨 ERROR DETECTED: ${msg.text()}`);
      }
      
      // Check for GraphQL server logs
      if (msg.text().includes('[GraphQL Server]')) {
        console.log(`📡 GraphQL: ${msg.text()}`);
      }
      
      // Check for database service logs
      if (msg.text().includes('[ClassDbService]')) {
        console.log(`🗄️  Database: ${msg.text()}`);
      }
    });
  }

  getIssues() {
    return this.issues;
  }

  getLogs() {
    return this.logs;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalLogs: this.logs.length,
      issues: this.issues.length,
      errorTypes: this.issues.map(i => i.type),
      summary: {
        graphqlLogs: this.logs.filter(l => l.text.includes('[GraphQL Server]')).length,
        databaseLogs: this.logs.filter(l => l.text.includes('[ClassDbService]')).length,
        errorLogs: this.logs.filter(l => l.text.includes('ERROR') || l.text.includes('error')).length
      }
    };
    
    return report;
  }
}

// Main Test Runner
async function runTests() {
  console.log('🚀 Starting LMS Test Suite...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const monitor = new ConsoleLogMonitor();
  await monitor.startMonitoring(page);
  
  try {
    // Handle authentication (Keycloak)
    console.log('🔐 Handling authentication...');
    await page.goto(TEST_CONFIG.baseUrl);
    
    // Wait for user to login manually or handle auto-login
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    
    // Run tests
    await testProgramCRUD(page);
    await testSubjectCRUD(page);
    await testClassCRUD(page);
    
    // Generate report
    const report = monitor.generateReport();
    console.log('📊 Test Report:', JSON.stringify(report, null, 2));
    
    // Save logs to file
    const fs = require('fs');
    fs.writeFileSync('test-logs.json', JSON.stringify(monitor.getLogs(), null, 2));
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    const report = monitor.generateReport();
    console.log('📊 Test Report (with errors):', JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, ConsoleLogMonitor, TEST_CONFIG };
