# Test Data Cleanup - Explanation

## 🧹 What is CLEANUP_TEST_DATA?

### Purpose
`CLEANUP_TEST_DATA=true` automatically deletes test records created during test execution.

### How It Works

1. **Test Creates Data:**
   ```javascript
   // Test creates a program
   await programsPage.createProgram(programData);
   createdPrograms.push(programData.name_en); // Track it
   ```

2. **After Test Completes:**
   ```javascript
   test.afterEach(async ({ page }) => {
     if (testConfig.cleanup.enabled && !testConfig.cleanup.skipCleanup) {
       // Delete all tracked items
       for (const programName of createdPrograms) {
         await programsPage.deleteProgram(programName);
       }
     }
   });
   ```

3. **Result:**
   - ✅ Test data is automatically removed
   - ✅ Database stays clean
   - ✅ No manual cleanup needed

---

## 🔧 Environment Variables

### Enable Cleanup:
```env
CLEANUP_TEST_DATA=true
```

**What happens:**
- Tests track created items in arrays (e.g., `createdPrograms`, `createdSubjects`)
- After each test, `afterEach` hook deletes all tracked items
- Database is cleaned automatically

### Disable Cleanup:
```env
CLEANUP_TEST_DATA=false
# or just don't set it (defaults to false)
```

**What happens:**
- Tests still create data
- Data remains in database
- Useful for manual inspection

---

## 🐛 Optional Cleanup Flag for Debugging

### What is "Optional cleanup flag for debugging"?

This refers to `SKIP_CLEANUP=true`:

```env
SKIP_CLEANUP=true
```

### Purpose:
Even if `CLEANUP_TEST_DATA=true`, setting `SKIP_CLEANUP=true` will:
- ✅ Skip the cleanup step
- ✅ Keep test data in database
- ✅ Allow you to inspect what was created

### Use Cases:
1. **Debugging Failed Tests:**
   - Test fails, you want to see what was created
   - Set `SKIP_CLEANUP=true`
   - Run test again
   - Inspect database

2. **Manual Verification:**
   - Run tests with cleanup disabled
   - Manually check database
   - Verify data was created correctly

3. **Development:**
   - Keep test data for development
   - Use it as seed data
   - Build on top of it

---

## 📋 Examples

### Example 1: Normal Test Run (Cleanup Enabled)
```bash
CLEANUP_TEST_DATA=true npm run test:e2e
```

**Flow:**
1. Test creates Program "Test Program 123"
2. Test verifies it exists
3. Test completes
4. `afterEach` deletes "Test Program 123"
5. Database is clean ✅

### Example 2: Debugging (Skip Cleanup)
```bash
CLEANUP_TEST_DATA=true SKIP_CLEANUP=true npm run test:e2e
```

**Flow:**
1. Test creates Program "Test Program 123"
2. Test verifies it exists
3. Test completes
4. `afterEach` checks `SKIP_CLEANUP=true` → Skips deletion
5. "Test Program 123" remains in database ✅
6. You can inspect it manually

### Example 3: No Cleanup (Default)
```bash
npm run test:e2e
# or
CLEANUP_TEST_DATA=false npm run test:e2e
```

**Flow:**
1. Test creates Program "Test Program 123"
2. Test verifies it exists
3. Test completes
4. `afterEach` checks `cleanup.enabled=false` → Skips cleanup
5. "Test Program 123" remains in database ✅

---

## 🎯 Summary

| Variable | Value | Result |
|----------|-------|--------|
| `CLEANUP_TEST_DATA` | `true` | ✅ Cleanup enabled |
| `CLEANUP_TEST_DATA` | `false` | ❌ Cleanup disabled |
| `SKIP_CLEANUP` | `true` | ⏭️ Skip cleanup (even if enabled) |
| `SKIP_CLEANUP` | `false` | ✅ Normal cleanup (if enabled) |

### Recommended Usage:

**CI/CD (Automated):**
```env
CLEANUP_TEST_DATA=true
SKIP_CLEANUP=false
```

**Local Development:**
```env
CLEANUP_TEST_DATA=false
# Keep data for inspection
```

**Debugging:**
```env
CLEANUP_TEST_DATA=true
SKIP_CLEANUP=true
# Run test, inspect data, then cleanup manually
```

---

**Key Point:** Cleanup is **optional** and **configurable**. Use it when you want automatic cleanup, skip it when you need to inspect test data.
