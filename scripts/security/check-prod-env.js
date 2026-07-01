#!/usr/bin/env node

/**
 * Production environment variable checklist.
 *
 * Run before deploying to production:  node scripts/security/check-prod-env.js
 * Exits with code 1 if any required variable is missing or set to a known default.
 */

const required = [
  { key: 'NODE_ENV', expect: 'production', fatal: true },
  { key: 'WOPI_SECRET', noDefault: true, fatal: true },
  { key: 'MINIO_ACCESS_KEY', noDefault: true, fatal: true },
  { key: 'MINIO_SECRET_KEY', noDefault: true, fatal: true },
  { key: 'KEYCLOAK_ADMIN_PASSWORD', noDefault: true, blockDefault: 'admin123', fatal: true },
  { key: 'KEYCLOAK_URL', noDefault: false, warn: true },
  { key: 'KEYCLOAK_REALM', noDefault: false, warn: true },
  { key: 'KEYCLOAK_CLIENT_ID', noDefault: false, warn: true },
  { key: 'JWT_SECRET', noDefault: true, blockDefault: 'your-super-secret-jwt-key-change-in-production', fatal: true },
  { key: 'API_SECRET_KEY', noDefault: true, blockDefault: 'your-api-secret-key-change-in-production', fatal: true },
];

const recommended = [
  { key: 'ENABLE_SWAGGER', expect: 'false', warn: true },
  { key: 'DISABLE_HTTPS', expect: 'false', warn: true },
  { key: 'ENABLE_RATE_LIMITING', expect: 'true', warn: true },
];

let hasErrors = false;

console.log('\n=== Production Environment Variable Checklist ===\n');

for (const check of required) {
  const val = process.env[check.key];
  let status = 'PASS';
  let msg = '';

  if (val === undefined || val === '') {
    if (check.noDefault) {
      status = 'FAIL';
      msg = 'missing (required in production)';
      hasErrors = true;
    } else {
      status = 'WARN';
      msg = 'not set (will use dev default)';
    }
  } else if (check.blockDefault && val === check.blockDefault) {
    status = 'FAIL';
    msg = `still set to default "${val}" — must change in production`;
    hasErrors = true;
  } else if (check.expect && val !== check.expect) {
    status = 'WARN';
    msg = `expected "${check.expect}", got "${val}"`;
  } else {
    msg = 'set';
  }

  const icon = status === 'PASS' ? '[OK]' : status === 'WARN' ? '[WARN]' : '[FAIL]';
  console.log(`  ${icon} ${check.key}: ${msg}`);
}

console.log('\n--- Recommended (non-blocking) ---\n');

for (const check of recommended) {
  const val = process.env[check.key];
  let status = 'PASS';
  let msg = '';

  if (val === undefined || val === '') {
    status = 'WARN';
    msg = `not set (recommended: ${check.expect})`;
  } else if (check.expect && val !== check.expect) {
    status = 'WARN';
    msg = `expected "${check.expect}", got "${val}"`;
  } else {
    msg = 'set correctly';
  }

  const icon = status === 'PASS' ? '[OK]' : '[WARN]';
  console.log(`  ${icon} ${check.key}: ${msg}`);
}

console.log('\n=== Result ===');
if (hasErrors) {
  console.log('FAIL — fix the errors above before deploying.\n');
  process.exit(1);
} else {
  console.log('PASS — all required variables are set.\n');
  process.exit(0);
}
