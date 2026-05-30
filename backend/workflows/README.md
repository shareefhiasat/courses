# Workflow State Machine Documentation

## Overview

The workflow engine uses **XState** for managing workflow state transitions. This provides:

- ✅ **Type-safe state transitions** - Invalid transitions are caught at runtime
- ✅ **Predictable behavior** - State machines define all valid transitions
- ✅ **Testability** - State machines can be tested independently
- ✅ **Maintainability** - Easy to add new workflow types or modify existing ones
- ✅ **Visualization** - XState provides tools to visualize state machines

## Architecture

```
Controllers (HTTP Layer)
    ↓
Workflow Service (Business Logic)
    ↓
State Machines (State Management)
    ↓
Database Services (Persistence)
```

## Workflow Types

### 1. GENERAL_HR
**Flow:** Owner → HR → Approved

**States:**
- `DRAFT` - Document created by owner
- `SUBMITTED` - Document submitted for HR review
- `APPROVED` - HR approved (final state)
- `REJECTED` - HR rejected

**Transitions:**
- `DRAFT` → `SUBMIT` → `SUBMITTED`
- `SUBMITTED` → `APPROVE` → `APPROVED`
- `SUBMITTED` → `REJECT` → `REJECTED`
- `SUBMITTED` → `RETURN` → `DRAFT`
- `REJECTED` → `RESUBMIT` → `SUBMITTED`

### 2. GENERAL_ADMIN
**Flow:** Owner → Admin → Approved

**States:**
- `DRAFT` - Document created by owner
- `SUBMITTED` - Document submitted for Admin review
- `APPROVED` - Admin approved (final state)
- `REJECTED` - Admin rejected

**Transitions:**
- `DRAFT` → `SUBMIT` → `SUBMITTED`
- `SUBMITTED` → `APPROVE` → `APPROVED`
- `SUBMITTED` → `REJECT` → `REJECTED`
- `SUBMITTED` → `RETURN` → `DRAFT`
- `REJECTED` → `RESUBMIT` → `SUBMITTED`

### 3. GENERAL_MIXED_HR_ADMIN
**Flow:** Owner → HR → Admin → Approved

**States:**
- `DRAFT` - Document created by owner
- `SUBMITTED` - Document submitted for HR review
- `UNDER_ADMIN_REVIEW` - HR approved, waiting for Admin
- `APPROVED` - Admin approved (final state)
- `REJECTED` - Rejected at any stage

**Transitions:**
- `DRAFT` → `SUBMIT` → `SUBMITTED`
- `SUBMITTED` → `APPROVE` → `UNDER_ADMIN_REVIEW` (HR approves)
- `SUBMITTED` → `REJECT` → `REJECTED`
- `SUBMITTED` → `RETURN` → `DRAFT`
- `UNDER_ADMIN_REVIEW` → `APPROVE` → `APPROVED` (Admin approves)
- `UNDER_ADMIN_REVIEW` → `REJECT` → `REJECTED`
- `UNDER_ADMIN_REVIEW` → `RETURN` → `SUBMITTED` (Return to HR)
- `REJECTED` → `RESUBMIT` → `SUBMITTED`

### 4. GENERAL_MIXED_ADMIN_HR
**Flow:** Owner → Admin → HR → Approved

**States:**
- `DRAFT` - Document created by owner
- `SUBMITTED` - Document submitted for Admin review
- `UNDER_HR_REVIEW` - Admin approved, waiting for HR
- `APPROVED` - HR approved (final state)
- `REJECTED` - Rejected at any stage

**Transitions:**
- `DRAFT` → `SUBMIT` → `SUBMITTED`
- `SUBMITTED` → `APPROVE` → `UNDER_HR_REVIEW` (Admin approves)
- `SUBMITTED` → `REJECT` → `REJECTED`
- `SUBMITTED` → `RETURN` → `DRAFT`
- `UNDER_HR_REVIEW` → `APPROVE` → `APPROVED` (HR approves)
- `UNDER_HR_REVIEW` → `REJECT` → `REJECTED`
- `UNDER_HR_REVIEW` → `RETURN` → `SUBMITTED` (Return to Admin)
- `REJECTED` → `RESUBMIT` → `SUBMITTED`

## Usage

### In Controllers

```javascript
import { approveWorkflow, rejectWorkflow, returnWorkflow } from '../workflows/workflowService.js';

// Approve workflow
try {
  const nextStatus = approveWorkflow(workflowType, currentStatus);
  await updateStatus(documentId, nextStatus, userId, comment);
} catch (error) {
  // Invalid transition - return error to user
  return res.status(400).json({ error: error.message });
}
```

### Available Service Functions

```javascript
// Approve workflow document
approveWorkflow(workflowType, currentStatus) → nextStatus

// Reject workflow document
rejectWorkflow(workflowType, currentStatus) → nextStatus

// Return workflow to previous stage
returnWorkflow(workflowType, currentStatus) → nextStatus

// Submit workflow document
submitWorkflow(workflowType, currentStatus) → nextStatus

// Resubmit rejected workflow
resubmitWorkflow(workflowType, currentStatus) → nextStatus

// Check if action is valid
canPerformAction(workflowType, currentStatus, action) → boolean

// Get available actions for current state
getAvailableActions(workflowType, currentStatus) → ['APPROVE', 'REJECT', ...]

// Check if workflow is complete
isWorkflowComplete(currentStatus) → boolean
```

## Adding New Workflow Types

1. **Define the state machine** in `workflowStateMachines.js`:

```javascript
export const myNewWorkflowMachine = createMachine({
  id: 'myNewWorkflow',
  initial: 'DRAFT',
  states: {
    DRAFT: {
      on: { SUBMIT: 'SUBMITTED' }
    },
    SUBMITTED: {
      on: {
        APPROVE: 'APPROVED',
        REJECT: 'REJECTED'
      }
    },
    APPROVED: { type: 'final' },
    REJECTED: { type: 'final' }
  }
});
```

2. **Register the machine** in `getWorkflowMachine()`:

```javascript
export const getWorkflowMachine = (workflowType) => {
  const machines = {
    GENERAL_HR: generalHRMachine,
    GENERAL_ADMIN: generalAdminMachine,
    GENERAL_MIXED_HR_ADMIN: generalMixedHRAdminMachine,
    GENERAL_MIXED_ADMIN_HR: generalMixedAdminHRMachine,
    MY_NEW_WORKFLOW: myNewWorkflowMachine  // Add here
  };
  return machines[workflowType] || generalHRMachine;
};
```

3. **Update Prisma schema** to include the new workflow type in the enum

4. **Update frontend** workflow definitions to match

## Testing

```javascript
import { getNextState, isValidTransition } from './workflowStateMachines.js';

// Test valid transition
const nextState = getNextState('GENERAL_HR', 'SUBMITTED', 'APPROVE');
console.log(nextState); // 'APPROVED'

// Test invalid transition
const invalidState = getNextState('GENERAL_HR', 'APPROVED', 'APPROVE');
console.log(invalidState); // null

// Check if transition is valid
const isValid = isValidTransition('GENERAL_HR', 'SUBMITTED', 'APPROVE');
console.log(isValid); // true
```

## Benefits Over Previous Implementation

### Before (if/else chains):
```javascript
// Hard to maintain, error-prone
if (workflowType === 'GENERAL_MIXED_HR_ADMIN') {
  if (status === 'SUBMITTED') {
    nextStatus = 'UNDER_ADMIN_REVIEW';
  } else if (status === 'UNDER_ADMIN_REVIEW') {
    nextStatus = 'APPROVED';
  }
} else if (workflowType === 'GENERAL_MIXED_ADMIN_HR') {
  // More nested conditions...
}
```

### After (XState):
```javascript
// Clean, declarative, type-safe
const nextStatus = approveWorkflow(workflowType, currentStatus);
```

## Visualization

You can visualize the state machines using XState's visualizer:
https://stately.ai/viz

Copy the machine definition and paste it into the visualizer to see a diagram of all states and transitions.

## Error Handling

All workflow service functions throw descriptive errors for invalid transitions:

```javascript
try {
  const nextStatus = approveWorkflow('GENERAL_HR', 'APPROVED');
} catch (error) {
  console.error(error.message);
  // "Cannot approve workflow from status APPROVED for workflow type GENERAL_HR"
}
```

This ensures that invalid state transitions are caught early and provide clear error messages to users.
