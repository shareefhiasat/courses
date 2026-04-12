# 🚀 Run Tests Guide

## 📍 **Where to Run Tests From**

### **From Root Directory** (Recommended)
```bash
# From: E:\QAF\Github\courses\
npm run test                    # Run all tests
npm run test:ui                 # Run with UI mode
npm run test:programs:api       # Run programs API tests
npm run test:programs:ui        # Run programs UI tests
npm run test:demo               # Run demo test
npm run test:report             # View HTML report
```

### **From Client Directory**
```bash
# From: E:\QAF\Github\courses\client\
npx playwright test
npx playwright test programs.crud.spec.js
npx playwright test programs.ui.spec.js
```

---

## 🎯 **Available Test Commands**

### **All Tests**
```bash
npm run test                    # All tests
npm run test:ui                 # UI mode (interactive)
npm run test:headed             # Run with visible browser
npm run test:debug              # Debug mode
```

### **Programs Tests**
```bash
npm run test:programs:api       # API CRUD tests
npm run test:programs:ui        # UI tests
npm run test:programs           # All programs tests
```

### **Auth Tests**
```bash
npm run test:auth               # Authentication tests
```

### **Demo & Utility**
```bash
npm run test:demo               # Demo/test suite
npm run test:api                # All API tests
npm run test:ui                 # All UI tests
```

### **Reports**
```bash
npm run test:report             # View HTML report
npm run test:allure:serve       # Start Allure server
npm run test:allure:report      # Show Allure URL
```

---

## 📁 **Test Files Overview**

### **API Tests** (`*.crud.spec.js`)
- **`programs.crud.spec.js`** - Programs CRUD operations
- Fast execution (no browser)
- Direct GraphQL API calls
- Perfect for CI/CD

### **UI Tests** (`*.ui.spec.js`)
- **`programs.ui.spec.js`** - Programs UI interactions
- **`dashboard-programs.ui.spec.js`** - Dashboard programs
- Browser automation
- Full user experience testing

### **Utility Tests** (`*.test.js`)
- **`demo.test.js`** - Demo/test suite (4 tests)
- **`basic.test.js`** - Basic connectivity
- **`keycloak-api.test.js`** - Keycloak API tests
- **`auth.spec.js`** - Authentication tests

---

## 🎯 **Programs Tests Details**

### **API CRUD Test** (`programs.crud.spec.js`)
```
✅ CREATE - Add new program
✅ READ - Get program by ID  
✅ UPDATE - Modify program details
✅ LIST - Get all programs
✅ DELETE - Remove program
```

**Features:**
- Clean, visible console logs
- Real GraphQL mutations
- Proper cleanup
- No hype, just results

### **UI Test** (`programs.ui.spec.js`)
```
✅ CREATE - Add program via UI
✅ READ - View program details
✅ LIST - Verify programs list
```

**Features:**
- Robust element detection
- Multiple selector fallbacks
- Debug screenshots on failure
- Clear console logging

---

## 📊 **Viewing Reports**

### **Playwright HTML Report**
```bash
npm run test:report
# Opens: http://localhost:5174/test-results/reports/html/index.html
```

**Features:**
- Test execution timeline
- Detailed test results
- Console logs
- Screenshots on failure
- Test statistics

### **Allure Report** (when Docker fixed)
```bash
npm run test:allure:serve
npm run test:allure:report
# URL: http://localhost:5050/allure-docker-service/projects/default/reports/latest/index.html
```

---

## 🔧 **Test Configuration**

### **Environment Variables**
```bash
# Copy and configure
cp .env.test .env.local

# Key variables:
TEST_SUPER_ADMIN_EMAIL=shareef.hiasat@gmail.com
TEST_SUPER_ADMIN_PASSWORD=Jordan123$
KEYCLOAK_CLIENT_SECRET=military-lms-secret
```

### **Test URLs**
```
Application: http://localhost:5174
GraphQL: http://localhost:4001/graphql
Keycloak: http://localhost:8080
Allure: http://localhost:5050
```

---

## 🚀 **Quick Start Commands**

### **First Time Setup**
```bash
# 1. Run demo test (verify everything works)
npm run test:demo

# 2. Check reports
npm run test:report

# 3. Run programs tests
npm run test:programs:api
npm run test:programs:ui
```

### **Development Workflow**
```bash
# Run specific test with UI mode
npm run test:ui -- programs.crud.spec.js

# Debug failing test
npm run test:debug -- programs.ui.spec.js

# Run with visible browser
npm run test:headed -- programs.ui.spec.js
```

### **CI/CD Pipeline**
```bash
# Fast API tests for CI
npm run test:api

# All tests for full validation
npm run test
```

---

## 🎯 **Best Practices**

### **Running Tests**
1. **Start with demo test** to verify setup
2. **Use API tests** for fast validation
3. **Use UI tests** for full user experience
4. **Check reports** after each run

### **Debugging**
1. **Use UI mode** to see tests run
2. **Use debug mode** to step through tests
3. **Check screenshots** in test-results folder
4. **Review console logs** for detailed info

### **Test Development**
1. **Follow naming convention**: `*.ui.spec.js`, `*.crud.spec.js`, `*.test.js`
2. **Use testConfig** for credentials and URLs
3. **Add console logs** for visibility
4. **Clean up test data** after each test

---

## 📈 **Test Results Interpretation**

### **Success Indicators**
- ✅ All tests pass
- ✅ Programs created/updated/deleted successfully
- ✅ UI elements found and interacted with
- ✅ No error messages in console

### **Common Issues**
- **Element not found**: Check selectors and page load
- **Authentication failed**: Verify credentials and Keycloak
- **GraphQL errors**: Check API endpoints and permissions
- **Timeout issues**: Increase wait times or check network

---

*Last Updated: 2026-03-21*
*Clean, visible, and hype-free testing!*
