# 🧪 Centralized Testing Guide - Military LMS

> **Complete testing strategy covering E2E, API, GraphQL, Unit Tests, and Coverage**
>
> **QA Team Lead Approved Testing Framework**

---

## 📋 **TESTING STRATEGY OVERVIEW**

### **Testing Pyramid**
```
        /\
       /E2E\          ← UI Tests (Playwright)
      /------\
     /  API   \       ← API Tests (GraphQL + REST)
    /----------\
   /    Unit    \     ← Unit Tests (Jest)
  /--------------\
```

### **Test Types**
1. **E2E Tests** - Full user workflows (Playwright)
2. **API Tests** - GraphQL mutations/queries (Playwright Request API)
3. **Integration Tests** - Service integration (Jest)
4. **Unit Tests** - Component/function tests (Jest)
5. **Coverage** - Code coverage analysis (Jest + NYC)

---

## 🚀 **QUICK START**

### **Run All Tests**
```bash
# Run all test suites
npm run test:all

# Run specific test types
npm run test:e2e          # E2E tests
npm run test:api          # API tests
npm run test:unit         # Unit tests
npm run test:coverage     # With coverage report
```

### **Test with UI/Debugging**
```bash
# Playwright UI Mode (recommended for development)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### **View Reports**
```bash
# Playwright HTML Report
npm run test:e2e:report

# Allure Report (beautiful, detailed)
npm run test:allure:serve

# Generate Allure Report
npm run test:allure:generate
npm run test:allure:open
```

---

## 📁 **TEST STRUCTURE**

```
client/
├── tests/
│   ├── e2e/                           # End-to-End Tests
│   │   ├── specs/                     # Test specifications
│   │   │   ├── programs.crud.spec.js  # Programs CRUD tests
│   │   │   ├── subjects.crud.spec.js  # Subjects CRUD tests
│   │   │   ├── classes.crud.spec.js   # Classes CRUD tests
│   │   │   └── auth.spec.js           # Authentication tests
│   │   ├── helpers/                   # Reusable helpers
│   │   │   ├── crud.helper.js         # CRUD operations
│   │   │   └── auth.helper.js         # Authentication
│   │   ├── config/                    # Test configuration
│   │   │   ├── test.config.js         # Centralized config
│   │   │   └── constants.js           # Test constants
│   │   ├── fixtures/                  # Test data
│   │   │   └── users.js               # User fixtures
│   │   └── playwright.config.js       # Playwright config
│   ├── api/                           # API Tests
│   │   ├── graphql/                   # GraphQL tests
│   │   └── rest/                      # REST API tests
│   ├── integration/                   # Integration Tests
│   │   ├── services/                  # Service integration
│   │   └── database/                  # Database integration
│   └── unit/                          # Unit Tests
│       ├── components/                # Component tests
│       ├── hooks/                     # Hook tests
│       └── utils/                     # Utility tests
└── test-results/                      # Test outputs
    ├── html-report/                   # Playwright HTML
    ├── allure-results/                # Allure raw data
    ├── allure-report/                 # Allure HTML report
    ├── coverage/                      # Coverage reports
    └── screenshots/                   # Failure screenshots
```

---

## 🎯 **E2E TESTING (Playwright)**

### **Test Suite: Programs CRUD**

**File**: `tests/e2e/specs/programs.crud.spec.js`

**Test Flow**:
1. ✅ **CREATE** - Create new program
2. ✅ **SEARCH** - Find program using search
3. ✅ **READ** - View program details
4. ✅ **UPDATE** - Modify program information
5. ✅ **RELOAD** - Verify data persistence
6. ✅ **DELETE** - Remove program (cleanup)
7. ✅ **VERIFY** - Confirm deletion

**Run Tests**:
```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test programs.crud.spec.js

# Run with UI mode (recommended)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test -g "CREATE"
```

### **Reusable Test Helpers**

**CRUD Helper** (`helpers/crud.helper.js`):
```javascript
import { CRUDHelper } from '../helpers/crud.helper.js';

// In your test
const crudHelper = new CRUDHelper(page, testConfig);

// Create entity
await crudHelper.createEntity('Program', {
  name: 'Test Program',
  description: 'Test description'
});

// Search entity
await crudHelper.searchEntity('Test Program');

// Update entity
await crudHelper.updateEntity('Test Program', {
  name: 'Updated Program'
});

// Delete entity
await crudHelper.deleteEntity('Updated Program');
```

### **Test Configuration**

**Centralized Config** (`config/test.config.js`):
```javascript
export const testConfig = {
  baseUrl: 'http://localhost:5174',
  graphqlUrl: '/graphql',
  keycloakUrl: 'http://localhost:8080',
  superAdmin: {
    email: 'shareef.hiasat@gmail.com',
    password: 'Jordan123$'
  }
};
```

---

## 🔌 **API TESTING (GraphQL)**

### **GraphQL CRUD Tests**

**Test Flow**:
```javascript
test('API: Create Program', async ({ request }) => {
  const mutation = `
    mutation CreateProgram($input: CreateProgramInput!) {
      createProgram(input: $input) {
        id
        name
      }
    }
  `;

  const response = await request.post('/graphql', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    data: {
      query: mutation,
      variables: {
        input: { name: 'API Test Program' }
      }
    }
  });

  const data = await response.json();
  expect(data.data.createProgram).toBeTruthy();
});
```

### **GraphQL Helper**

```javascript
import { GraphQLCRUDHelper } from '../helpers/crud.helper.js';

const graphqlHelper = new GraphQLCRUDHelper(request, authToken, graphqlUrl);

// Create
const program = await graphqlHelper.createEntity('Program', {
  name: 'Test Program'
});

// Read
const data = await graphqlHelper.readEntity('Program', program.id);

// Update
await graphqlHelper.updateEntity('Program', program.id, {
  name: 'Updated Program'
});

// Delete
await graphqlHelper.deleteEntity('Program', program.id);
```

---

## 🧩 **UNIT TESTING (Jest)**

### **Component Tests**
```javascript
import { render, screen } from '@testing-library/react';
import ProgramCard from '@/components/ProgramCard';

test('renders program card', () => {
  render(<ProgramCard name="Test Program" />);
  expect(screen.getByText('Test Program')).toBeInTheDocument();
});
```

### **Hook Tests**
```javascript
import { renderHook } from '@testing-library/react-hooks';
import { usePrograms } from '@/hooks/usePrograms';

test('fetches programs', async () => {
  const { result, waitForNextUpdate } = renderHook(() => usePrograms());
  await waitForNextUpdate();
  expect(result.current.programs).toHaveLength(5);
});
```

---

## 📊 **TEST REPORTING**

### **1. Playwright HTML Report**

**Generate**:
```bash
npx playwright test
npx playwright show-report
```

**Features**:
- ✅ Test results overview
- ✅ Screenshots on failure
- ✅ Video recordings
- ✅ Trace viewer
- ✅ Timeline view

**Access**: `test-results/html-report/index.html`

### **2. Allure Reports (Recommended)**

**Setup**:
```bash
# Install Allure
npm install --save-dev allure-playwright allure-commandline

# Add to package.json
"test:allure:generate": "allure generate test-results/allure-results --clean",
"test:allure:open": "allure open test-results/allure-report",
"test:allure:serve": "allure serve test-results/allure-results"
```

**Generate Report**:
```bash
# Run tests
npx playwright test

# Generate and open report
npm run test:allure:serve
```

**Features**:
- ✅ Beautiful UI
- ✅ Test history
- ✅ Trend charts
- ✅ Categories (Critical, Flaky)
- ✅ Attachments (screenshots, videos)
- ✅ Environment info
- ✅ Execution timeline

**Access**: `http://localhost:PORT` (auto-opens)

### **3. Docker-based Allure Server**

**Docker Compose** (`docker-compose.allure.yml`):
```yaml
version: '3.8'

services:
  allure:
    image: frankescobar/allure-docker-service:latest
    container_name: allure-server
    ports:
      - "5050:5050"
      - "4040:4040"
    environment:
      CHECK_RESULTS_EVERY_SECONDS: 3
      KEEP_HISTORY: 1
    volumes:
      - ./test-results/allure-results:/app/allure-results
      - ./test-results/allure-reports:/app/default-reports
```

**Run**:
```bash
docker-compose -f docker-compose.allure.yml up -d

# Access Allure UI
http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html
```

### **4. Coverage Reports**

**Generate**:
```bash
npm run test:coverage
```

**View**:
- **HTML**: `coverage/lcov-report/index.html`
- **Terminal**: Summary in console
- **CI/CD**: `coverage/lcov.info`

---

## 🎨 **TEST VISUALIZATION TOOLS**

### **Recommended Tools**

#### **1. Allure Reports** ⭐ (Recommended)
- **Type**: Open-source reporting framework
- **Features**: Beautiful UI, history, trends, categories
- **Docker**: `frankescobar/allure-docker-service`
- **Best For**: Comprehensive test reporting

#### **2. Playwright UI Mode** ⭐
- **Type**: Built-in Playwright feature
- **Features**: Live test execution, debugging, time-travel
- **Command**: `npx playwright test --ui`
- **Best For**: Development and debugging

#### **3. ReportPortal**
- **Type**: AI-powered test automation dashboard
- **Features**: ML-based failure analysis, real-time reporting
- **Docker**: Available via Docker Compose
- **Best For**: Enterprise-level test management

#### **4. TestRail**
- **Type**: Test case management
- **Features**: Test planning, execution tracking
- **Integration**: Playwright + Jest
- **Best For**: Test case organization

#### **5. Grafana + InfluxDB**
- **Type**: Metrics visualization
- **Features**: Custom dashboards, performance metrics
- **Docker**: Available
- **Best For**: Performance monitoring

---

## 🔧 **CONFIGURATION**

### **Playwright Configuration**

**File**: `tests/e2e/playwright.config.js`

```javascript
export default defineConfig({
  testDir: './specs',
  timeout: 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['allure-playwright', { 
      outputFolder: 'test-results/allure-results'
    }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5174',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
});
```

### **Jest Configuration**

**File**: `jest.config.js`

```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}'
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

---

## 📈 **CI/CD INTEGRATION**

### **GitHub Actions**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Generate Allure Report
        run: npm run test:allure:generate
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## 🎯 **BEST PRACTICES**

### **Test Organization**
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Keep tests independent
- ✅ Use test helpers for reusability
- ✅ Clean up test data

### **Test Data**
- ✅ Use unique identifiers (timestamps)
- ✅ Clean up after tests
- ✅ Use fixtures for common data
- ✅ Avoid hard-coded values

### **Assertions**
- ✅ Use specific assertions
- ✅ Add meaningful error messages
- ✅ Test both positive and negative cases
- ✅ Verify state changes

### **Performance**
- ✅ Run tests in parallel
- ✅ Use API tests for speed
- ✅ Mock external dependencies
- ✅ Optimize test data setup

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **Tests Failing Locally**
```bash
# Clear test cache
rm -rf test-results/
rm -rf .playwright/

# Reinstall dependencies
npm ci

# Update Playwright browsers
npx playwright install
```

#### **Flaky Tests**
- Add retries in config
- Increase timeouts
- Use proper waits (not `waitForTimeout`)
- Check for race conditions

#### **Report Generation Fails**
```bash
# Clear old reports
rm -rf test-results/allure-results/
rm -rf test-results/allure-report/

# Regenerate
npm run test:allure:generate
```

---

## 📞 **SUPPORT**

### **Documentation**
- **Playwright**: https://playwright.dev
- **Jest**: https://jestjs.io
- **Allure**: https://docs.qameta.io/allure

### **Internal Resources**
- **Test Helpers**: `tests/e2e/helpers/`
- **Test Config**: `tests/e2e/config/test.config.js`
- **Examples**: `tests/e2e/specs/programs.crud.spec.js`

---

*Last Updated: 2026-03-21*
*QA Team Lead Approved - Centralized Testing Guide*
