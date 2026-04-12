# 🧪 E2E Testing Documentation

> **Complete E2E Testing Framework with Allure Reporting**
>
> **Test Environment**: https://localhost:5174 | GraphQL: http://localhost:4001/graphql
>
> **Allure Reports**: http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html

---

## 🚀 **Quick Start**

### **1. Ensure Services Are Running**
```powershell
# Check if GraphQL server is running
netstat -ano | findstr :4001

# Check if frontend is running  
netstat -ano | findstr :5174

# If not running, start them:
# Terminal 1: GraphQL server
cd E:\QAF\Github\courses\client
node working-graphql-server.cjs

# Terminal 2: Frontend
cd E:\QAF\Github\courses\client
pnpm run dev

# Terminal 3: Start LMS Docker stack (includes Allure)
cd E:\QAF\Github\courses
.\scripts\dev-start.ps1
```

### **2. Run Your First Test**
```powershell
cd E:\QAF\Github\courses\client

# Run basic connectivity test
npx playwright test basic.test.js

# Or run with UI mode (recommended)
npx playwright test basic.test.js --ui

# Run all tests
npx playwright test
```

### **3. Expected Results**
```
🔍 Current URL: http://localhost:8080/realms/military-lms/protocol/openid-connect/auth?...
✅ Application redirected to Keycloak authentication (expected)
✅ Keycloak login form is accessible
✅ Authentication successful - redirected back to app
✅ GraphQL server is accessible
✅ Keycloak is accessible

5 passed (15.2s)
```

---

## 🎯 **Allure Reporting - Integrated with LMS Docker Stack**

### **✅ Allure is part of the main LMS Docker stack!**

**Start Allure with LMS Stack:**
```bash
# Start all LMS services including Allure
cd E:\QAF\Github\courses
.\scripts\dev-start.ps1

# Or start only Allure (if stack is already running)
cd E:\QAF\Github\courses\scripts\docker
docker-compose -f docker-compose.dev.yml up -d allure
```

**Access Allure Dashboard:**
- **Primary Report**: http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html ⭐
- **Alternative URLs**:
  - http://localhost:5050/allure-docker-service/ui/
  - http://localhost:5050/projects/default/reports/latest
  - http://localhost:5050/ui/
- **Allure API**: http://localhost:4040

### **🔍 If You See Swagger**
If you're seeing Swagger at `http://localhost:5050`, use the primary report URL above. The Allure Docker service shows Swagger API at the root, but test reports are at the specific path.

### **🎯 Integrated Services**
```
LMS Docker Stack:
├── MongoDB (27017)
├── Redis (6379)  
├── MinIO (9000/9001)
├── Keycloak (8080)
├── Elasticsearch (9200)
├── Logstash (9201)
├── Kibana (5601)
├── Grafana (3002)
├── Prometheus (9090)
├── Maildev (1080)
└── Allure (5050) ⭐ Test Reporting
```

### **📊 Allure Dashboard Features**
- ✅ **Overview** - Test statistics and trends
- ✅ **Suites** - Test organization by feature
- ✅ **Categories** - Critical failures, Flaky tests
- ✅ **Timeline** - Execution timeline
- ✅ **Graphs** - Success rate, duration trends
- ✅ **History** - Test history across runs
- ✅ **Screenshots** - Automatic on failure
- ✅ **Videos** - Test execution recordings

---

## 🧪 **Test Structure & Commands**

### **Test Files**
```
tests/e2e/
├── specs/
│   ├── basic.test.js           # Basic connectivity & auth
│   ├── programs.crud.spec.js   # Programs CRUD operations
│   ├── subjects.crud.spec.js   # Subjects CRUD operations
│   └── classes.crud.spec.js    # Classes CRUD operations
├── helpers/
│   ├── crud.helper.js          # Reusable CRUD operations
│   └── auth.helper.js          # Authentication utilities
├── config/
│   ├── test.config.js          # Test configuration
│   └── constants.js            # Test constants
└── pages/
    ├── DashboardPage.js         # Page objects
    └── LoginPage.js             # Page objects
```

### **Run Commands**
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test basic.test.js
npx playwright test programs.crud.spec.js

# Run with UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run with debug
npx playwright test --debug

# Run specific test by name
npx playwright test -g "Application loads successfully"
```

### **View Reports**
```bash
# Allure Report (beautiful, recommended)
# Access at: http://localhost:5050

# Playwright HTML Report
npx playwright show-report

# Generate Allure report manually
npx allure generate test-results/allure-results --clean
npx allure open
```

---

## 🎯 **Test Types**

### **1. Basic Connectivity Tests** (`basic.test.js`)
- ✅ Application loads and redirects to Keycloak
- ✅ Keycloak authentication flow works
- ✅ GraphQL server is accessible
- ✅ Keycloak service is healthy

### **2. CRUD Tests** (`programs.crud.spec.js`)
- ✅ CREATE - Create new program
- ✅ SEARCH - Find program using search
- ✅ READ - View program details
- ✅ UPDATE - Modify program information
- ✅ RELOAD - Verify data persistence
- ✅ DELETE - Remove program (cleanup)
- ✅ VERIFY - Confirm deletion

### **3. API Tests** (GraphQL)
- ✅ API-level CRUD operations
- ✅ Direct GraphQL mutations/queries
- ✅ Faster execution for CI/CD

### **4. Reusable Test Patterns**
```javascript
import { CRUDHelper, TestDataGenerator } from '../helpers/crud.helper.js';

const crudHelper = new CRUDHelper(page, testConfig);

// Create entity
await crudHelper.createEntity('Program', TestDataGenerator.generateProgramData());

// Search entity
await crudHelper.searchEntity('Test Program');

// Update entity
await crudHelper.updateEntity('Test Program', { name: 'Updated Program' });

// Delete entity
await crudHelper.deleteEntity('Updated Program');
```

---

## 📱 **All Service URLs**

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5174 | Main application |
| **GraphQL** | http://localhost:4001/graphql | API endpoint |
| **Allure** | http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html | Test reports ⭐ |
| **Keycloak** | http://localhost:8080 | Authentication |
| **MongoDB** | localhost:27017 | Database |
| **Kibana** | http://localhost:5601 | Log visualization |
| **Grafana** | http://localhost:3002 | Metrics dashboard |
| **MinIO** | http://localhost:9001 | File storage |

---

## 🔧 **Configuration**

### **Test Configuration** (`config/test.config.js`)
```javascript
export const testConfig = {
  baseUrl: 'http://localhost:5174',
  graphqlUrl: 'http://localhost:4001/graphql',
  keycloakUrl: 'http://localhost:8080',
  keycloakRealm: 'military-lms',
  keycloakClientId: 'military-lms-app',
  superAdmin: {
    email: 'shareef.hiasat@gmail.com',
    password: 'Jordan123$'
  }
};
```

### **Playwright Configuration** (`playwright.config.js`)
- ✅ Allure reporting enabled
- ✅ HTML reports
- ✅ JUnit XML for CI/CD
- ✅ Screenshots on failure
- ✅ Video recordings
- ✅ Trace files for debugging

---

## 🚨 **Troubleshooting**

### **Test Failures**

#### **Application not accessible**
```bash
# Check if frontend is running
curl http://localhost:5174

# Restart frontend
pnpm run dev
```

#### **GraphQL not accessible**
```bash
# Check if GraphQL server is running
curl http://localhost:4001/graphql

# Restart GraphQL server
node working-graphql-server.cjs
```

#### **Keycloak issues**
```bash
# Check if Keycloak is running
curl http://localhost:8080

# Restart Docker services
.\scripts\dev-start.ps1
```

### **Allure Issues**

#### **Allure not accessible**
```bash
# Check if container is running
docker ps | grep allure

# Check logs
docker logs lms-qaf-allure

# Restart Allure
docker-compose -f scripts/docker/docker-compose.dev.yml restart allure
```

#### **No test results**
```bash
# Check if test results directory exists
ls test-results/allure-results

# Run tests to generate results
npx playwright test basic.test.js

# Check permissions
docker exec lms-qaf-allure ls /app/allure-results
```

### **Common Issues**

#### **Syntax errors in source code**
- Check terminal output for specific file and line number
- Fix syntax errors in source files
- Restart tests

#### **Flaky tests**
- Increase timeouts in test configuration
- Use proper wait strategies (not `waitForTimeout`)
- Add retries in Playwright config

#### **Port conflicts**
```bash
# Check what's using port
netstat -ano | findstr :5174
netstat -ano | findstr :4001
netstat -ano | findstr :5050

# Stop conflicting services and restart
```

---

## 🎯 **Best Practices**

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

### **Performance**
- ✅ Run tests in parallel
- ✅ Use API tests for speed
- ✅ Mock external dependencies
- ✅ Optimize test data setup

---

## 📚 **Documentation References**

### **Main Documentation**
- **Testing Guide**: `docs/guides/testing.md` - Comprehensive testing strategy
- **Scripts Guide**: `scripts/README.md` - All operational procedures
- **System Docs**: `docs/README.md` - Complete system documentation

### **Test Configuration**
- **Test Config**: `tests/e2e/config/test.config.js` - Centralized settings
- **Playwright Config**: `tests/e2e/playwright.config.js` - Test runner settings
- **Constants**: `tests/e2e/config/constants.js` - Test constants

### **Test Examples**
- **Basic Tests**: `tests/e2e/specs/basic.test.js` - Connectivity examples
- **CRUD Tests**: `tests/e2e/specs/programs.crud.spec.js` - CRUD patterns
- **Helpers**: `tests/e2e/helpers/crud.helper.js` - Reusable utilities

---

## 🎉 **Success Indicators**

✅ All tests pass consistently  
✅ Allure dashboard shows beautiful reports  
✅ Screenshots and videos on failure  
✅ Test history and trends visible  
✅ CI/CD integration ready  
✅ Reusable test patterns working  
✅ Authentication flow working  
✅ GraphQL API accessible  

---

**🚀 Ready to test! Run `npx playwright test basic.test.js` to get started!**

---

*Last Updated: 2026-03-21*
*Complete E2E Testing Framework with Allure Reporting*
