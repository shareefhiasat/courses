import { createMachine, createActor } from 'xstate';

/**
 * Workflow State Machine Definitions
 * 
 * Each workflow type has its own state machine that defines:
 * - Valid states
 * - Valid transitions between states
 * - Events that trigger transitions
 * 
 * This ensures type-safe, predictable workflow state management
 */

// GENERAL_HR Workflow: Owner → HR Review → Approved
export const generalHRMachine = createMachine({
  id: 'generalHR',
  initial: 'DRAFT',
  states: {
    DRAFT: {
      on: {
        SUBMIT: { target: 'SUBMITTED' }
      }
    },
    SUBMITTED: {
      on: {
        APPROVE: { target: 'UNDER_HR_REVIEW' },
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'DRAFT' }
      }
    },
    UNDER_HR_REVIEW: {
      on: {
        APPROVE: { target: 'APPROVED' },
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'SUBMITTED' }
      }
    },
    APPROVED: {
      type: 'final'
    },
    REJECTED: {
      on: {
        RESUBMIT: { target: 'SUBMITTED' }
      }
    }
  }
});

// GENERAL_ADMIN Workflow: Owner → Admin Review → Approved
export const generalAdminMachine = createMachine({
  id: 'generalAdmin',
  initial: 'DRAFT',
  states: {
    DRAFT: {
      on: {
        SUBMIT: { target: 'SUBMITTED' }
      }
    },
    SUBMITTED: {
      on: {
        APPROVE: { target: 'UNDER_ADMIN_REVIEW' },
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'DRAFT' }
      }
    },
    UNDER_ADMIN_REVIEW: {
      on: {
        APPROVE: { target: 'APPROVED' },
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'SUBMITTED' }
      }
    },
    APPROVED: {
      type: 'final'
    },
    REJECTED: {
      on: {
        RESUBMIT: { target: 'SUBMITTED' }
      }
    }
  }
});

// GENERAL_MIXED_HR_ADMIN Workflow: Owner → HR Review → Admin Review → Approved
export const generalMixedHRAdminMachine = createMachine({
  id: 'generalMixedHRAdmin',
  initial: 'DRAFT',
  states: {
    DRAFT: {
      on: {
        SUBMIT: { target: 'SUBMITTED' }
      }
    },
    SUBMITTED: {
      on: {
        APPROVE: { target: 'UNDER_HR_REVIEW' }, // HR approves → goes to Admin
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'DRAFT' }
      }
    },
    UNDER_HR_REVIEW: {
      on: {
        APPROVE: { target: 'UNDER_ADMIN_REVIEW' }, // HR approves → goes to Admin
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'SUBMITTED' }
      }
    },
    UNDER_ADMIN_REVIEW: {
      on: {
        APPROVE: { target: 'APPROVED' }, // Admin approves → final approval
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'UNDER_HR_REVIEW' } // Return to HR
      }
    },
    APPROVED: {
      type: 'final'
    },
    REJECTED: {
      on: {
        RESUBMIT: { target: 'SUBMITTED' }
      }
    }
  }
});

// GENERAL_MIXED_ADMIN_HR Workflow: Owner → Admin Review → HR Review → Approved
export const generalMixedAdminHRMachine = createMachine({
  id: 'generalMixedAdminHR',
  initial: 'DRAFT',
  states: {
    DRAFT: {
      on: {
        SUBMIT: { target: 'SUBMITTED' }
      }
    },
    SUBMITTED: {
      on: {
        APPROVE: { target: 'UNDER_ADMIN_REVIEW' }, // Admin approves → goes to HR
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'DRAFT' }
      }
    },
    UNDER_ADMIN_REVIEW: {
      on: {
        APPROVE: { target: 'UNDER_HR_REVIEW' }, // Admin approves → goes to HR
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'SUBMITTED' }
      }
    },
    UNDER_HR_REVIEW: {
      on: {
        APPROVE: { target: 'APPROVED' }, // HR approves → final approval
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'UNDER_ADMIN_REVIEW' } // Return to Admin
      }
    },
    APPROVED: {
      type: 'final'
    },
    REJECTED: {
      on: {
        RESUBMIT: { target: 'SUBMITTED' }
      }
    }
  }
});

// INSTRUCTOR_THEN_HR Workflow: Instructor submits → HR Review → Approved
export const instructorThenHRMachine = createMachine({
  id: 'instructorThenHR',
  initial: 'DRAFT',
  states: {
    DRAFT: {
      on: {
        SUBMIT: { target: 'SUBMITTED' }
      }
    },
    SUBMITTED: {
      on: {
        APPROVE: { target: 'UNDER_HR_REVIEW' },
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'DRAFT' }
      }
    },
    UNDER_HR_REVIEW: {
      on: {
        APPROVE: { target: 'APPROVED' },
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'SUBMITTED' }
      }
    },
    UNDER_REVIEW: {
      on: {
        APPROVE: { target: 'APPROVED' },
        REJECT: { target: 'REJECTED' },
        RETURN: { target: 'SUBMITTED' }
      }
    },
    APPROVED: {
      type: 'final'
    },
    REJECTED: {
      on: {
        RESUBMIT: { target: 'SUBMITTED' }
      }
    }
  }
});

/**
 * Resolve machine key from approvalFlow or legacy workflowType.
 */
export function resolveMachineKey(approvalFlowOrLegacyType) {
  const legacyToFlow = {
    GENERAL_HR: 'HR_ONLY',
    GENERAL_ADMIN: 'ADMIN_ONLY',
    GENERAL_MIXED_HR_ADMIN: 'HR_THEN_ADMIN',
    GENERAL_MIXED_ADMIN_HR: 'ADMIN_THEN_HR',
    ATTENDANCE_DAILY: 'INSTRUCTOR_THEN_HR',
    ATTENDANCE_WEEKLY: 'HR_THEN_ADMIN',
  };

  return legacyToFlow[approvalFlowOrLegacyType] || approvalFlowOrLegacyType || 'HR_ONLY';
}

/**
 * Get the appropriate state machine for a workflow type
 */
export const getWorkflowMachine = (approvalFlowOrLegacyType) => {
  const key = resolveMachineKey(approvalFlowOrLegacyType);
  const machines = {
    HR_ONLY: generalHRMachine,
    ADMIN_ONLY: generalAdminMachine,
    HR_THEN_ADMIN: generalMixedHRAdminMachine,
    ADMIN_THEN_HR: generalMixedAdminHRMachine,
    INSTRUCTOR_THEN_HR: instructorThenHRMachine,
    GENERAL_HR: generalHRMachine,
    GENERAL_ADMIN: generalAdminMachine,
    GENERAL_MIXED_HR_ADMIN: generalMixedHRAdminMachine,
    GENERAL_MIXED_ADMIN_HR: generalMixedAdminHRMachine,
    ATTENDANCE_DAILY: instructorThenHRMachine,
    ATTENDANCE_WEEKLY: generalMixedHRAdminMachine,
  };

  return machines[key] || generalHRMachine;
};

/**
 * Get the next state for a given workflow type, current state, and event
 * Returns null if transition is invalid
 */
export const getNextState = (approvalFlowOrLegacyType, currentState, event) => {
  const machine = getWorkflowMachine(approvalFlowOrLegacyType);
  
  // Get the current state node from config
  const currentStateNode = machine.config.states[currentState];
  if (!currentStateNode || !currentStateNode.on || !currentStateNode.on[event]) {
    return null; // Invalid transition
  }
  
  // Get the target from the transition
  const transition = currentStateNode.on[event];
  
  // XState v5 stores target in the transition object
  if (typeof transition === 'string') {
    return transition;
  }
  
  if (transition && transition.target) {
    return transition.target;
  }
  
  return null;
};

/**
 * Check if a transition is valid for a workflow
 */
export const isValidTransition = (approvalFlowOrLegacyType, currentState, event) => {
  const nextState = getNextState(approvalFlowOrLegacyType, currentState, event);
  return nextState !== null;
};

/**
 * Get all valid events for the current state
 */
export const getValidEvents = (approvalFlowOrLegacyType, currentState) => {
  const machine = getWorkflowMachine(approvalFlowOrLegacyType);
  const stateNode = machine.config.states[currentState];
  
  if (!stateNode || !stateNode.on) {
    return [];
  }
  
  return Object.keys(stateNode.on);
};
