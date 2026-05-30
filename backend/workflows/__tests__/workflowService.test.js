/**
 * Workflow Service Tests
 * 
 * These tests demonstrate how the XState workflow service works
 * Run with: node backend/workflows/__tests__/workflowService.test.js
 */

import {
  approveWorkflow,
  rejectWorkflow,
  returnWorkflow,
  submitWorkflow,
  resubmitWorkflow,
  canPerformAction,
  getAvailableActions,
  isWorkflowComplete
} from '../workflowService.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n   Expected: ${expected}\n   Actual: ${actual}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(`${message} - Expected function to throw but it didn't`);
  } catch (error) {
    if (error.message.includes('Expected function to throw')) {
      throw error;
    }
    // Function threw as expected
  }
}

console.log('\n🧪 Running Workflow Service Tests\n');

// GENERAL_HR Workflow Tests
console.log('📋 GENERAL_HR Workflow Tests');
test('GENERAL_HR: Submit from DRAFT', () => {
  const next = submitWorkflow('GENERAL_HR', 'DRAFT');
  assertEquals(next, 'SUBMITTED', 'Should transition to SUBMITTED');
});

test('GENERAL_HR: Approve from SUBMITTED', () => {
  const next = approveWorkflow('GENERAL_HR', 'SUBMITTED');
  assertEquals(next, 'APPROVED', 'Should transition to APPROVED');
});

test('GENERAL_HR: Reject from SUBMITTED', () => {
  const next = rejectWorkflow('GENERAL_HR', 'SUBMITTED');
  assertEquals(next, 'REJECTED', 'Should transition to REJECTED');
});

test('GENERAL_HR: Return from SUBMITTED', () => {
  const next = returnWorkflow('GENERAL_HR', 'SUBMITTED');
  assertEquals(next, 'DRAFT', 'Should transition to DRAFT');
});

test('GENERAL_HR: Cannot approve from APPROVED', () => {
  assertThrows(
    () => approveWorkflow('GENERAL_HR', 'APPROVED'),
    'Should throw error for invalid transition'
  );
});

// GENERAL_MIXED_HR_ADMIN Workflow Tests
console.log('\n📋 GENERAL_MIXED_HR_ADMIN Workflow Tests');
test('MIXED_HR_ADMIN: Submit from DRAFT', () => {
  const next = submitWorkflow('GENERAL_MIXED_HR_ADMIN', 'DRAFT');
  assertEquals(next, 'SUBMITTED', 'Should transition to SUBMITTED');
});

test('MIXED_HR_ADMIN: HR approves from SUBMITTED', () => {
  const next = approveWorkflow('GENERAL_MIXED_HR_ADMIN', 'SUBMITTED');
  assertEquals(next, 'UNDER_ADMIN_REVIEW', 'Should transition to UNDER_ADMIN_REVIEW');
});

test('MIXED_HR_ADMIN: Admin approves from UNDER_ADMIN_REVIEW', () => {
  const next = approveWorkflow('GENERAL_MIXED_HR_ADMIN', 'UNDER_ADMIN_REVIEW');
  assertEquals(next, 'APPROVED', 'Should transition to APPROVED');
});

test('MIXED_HR_ADMIN: Return from UNDER_ADMIN_REVIEW', () => {
  const next = returnWorkflow('GENERAL_MIXED_HR_ADMIN', 'UNDER_ADMIN_REVIEW');
  assertEquals(next, 'SUBMITTED', 'Should return to SUBMITTED');
});

test('MIXED_HR_ADMIN: Reject from UNDER_ADMIN_REVIEW', () => {
  const next = rejectWorkflow('GENERAL_MIXED_HR_ADMIN', 'UNDER_ADMIN_REVIEW');
  assertEquals(next, 'REJECTED', 'Should transition to REJECTED');
});

// GENERAL_MIXED_ADMIN_HR Workflow Tests
console.log('\n📋 GENERAL_MIXED_ADMIN_HR Workflow Tests');
test('MIXED_ADMIN_HR: Admin approves from SUBMITTED', () => {
  const next = approveWorkflow('GENERAL_MIXED_ADMIN_HR', 'SUBMITTED');
  assertEquals(next, 'UNDER_HR_REVIEW', 'Should transition to UNDER_HR_REVIEW');
});

test('MIXED_ADMIN_HR: HR approves from UNDER_HR_REVIEW', () => {
  const next = approveWorkflow('GENERAL_MIXED_ADMIN_HR', 'UNDER_HR_REVIEW');
  assertEquals(next, 'APPROVED', 'Should transition to APPROVED');
});

test('MIXED_ADMIN_HR: Return from UNDER_HR_REVIEW', () => {
  const next = returnWorkflow('GENERAL_MIXED_ADMIN_HR', 'UNDER_HR_REVIEW');
  assertEquals(next, 'SUBMITTED', 'Should return to SUBMITTED');
});

// Utility Functions Tests
console.log('\n📋 Utility Functions Tests');
test('canPerformAction: Valid action', () => {
  const canApprove = canPerformAction('GENERAL_HR', 'SUBMITTED', 'APPROVE');
  assertEquals(canApprove, true, 'Should allow APPROVE from SUBMITTED');
});

test('canPerformAction: Invalid action', () => {
  const canApprove = canPerformAction('GENERAL_HR', 'APPROVED', 'APPROVE');
  assertEquals(canApprove, false, 'Should not allow APPROVE from APPROVED');
});

test('getAvailableActions: SUBMITTED state', () => {
  const actions = getAvailableActions('GENERAL_HR', 'SUBMITTED');
  assertEquals(actions.includes('APPROVE'), true, 'Should include APPROVE');
  assertEquals(actions.includes('REJECT'), true, 'Should include REJECT');
  assertEquals(actions.includes('RETURN'), true, 'Should include RETURN');
});

test('getAvailableActions: APPROVED state', () => {
  const actions = getAvailableActions('GENERAL_HR', 'APPROVED');
  assertEquals(actions.length, 0, 'Should have no available actions');
});

test('isWorkflowComplete: APPROVED', () => {
  const isComplete = isWorkflowComplete('APPROVED');
  assertEquals(isComplete, true, 'APPROVED should be complete');
});

test('isWorkflowComplete: SUBMITTED', () => {
  const isComplete = isWorkflowComplete('SUBMITTED');
  assertEquals(isComplete, false, 'SUBMITTED should not be complete');
});

// Resubmit Tests
console.log('\n📋 Resubmit Tests');
test('Resubmit from REJECTED', () => {
  const next = resubmitWorkflow('GENERAL_HR', 'REJECTED');
  assertEquals(next, 'SUBMITTED', 'Should transition to SUBMITTED');
});

test('Cannot resubmit from APPROVED', () => {
  assertThrows(
    () => resubmitWorkflow('GENERAL_HR', 'APPROVED'),
    'Should throw error for invalid transition'
  );
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log('='.repeat(50) + '\n');

if (testsFailed > 0) {
  process.exit(1);
}
