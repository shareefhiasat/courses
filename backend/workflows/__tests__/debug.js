import { generalHRMachine } from '../workflowStateMachines.js';

console.log('Machine config:', JSON.stringify(generalHRMachine.config, null, 2));
console.log('\nMachine states:', Object.keys(generalHRMachine.config.states));
console.log('\nDRAFT state:', generalHRMachine.config.states.DRAFT);
