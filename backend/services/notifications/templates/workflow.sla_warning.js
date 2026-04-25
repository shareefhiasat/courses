/**
 * Workflow SLA Warning Template
 * 
 * Event: workflow.sla_warning
 * Category: WORKFLOW
 * Default Priority: HIGH
 */

import { CATEGORIES, PRIORITIES } from '../constants.js';

export default {
  event: 'workflow.sla_warning',
  category: CATEGORIES.WORKFLOW,
  defaultPriority: PRIORITIES.HIGH,
  
  render(payload, lang) {
    const { workflowName, stageName, instanceId, slaDeadline } = payload;
    
    if (lang === 'ar') {
      return {
        titleEn: 'SLA Warning',
        titleAr: `تحذير SLA: ${workflowName}`,
        bodyEn: `Workflow "${workflowName}" at stage "${stageName}" is approaching its SLA deadline of ${slaDeadline}. Please review.`,
        bodyAr: `سير العمل "${workflowName}" في مرحلة "${stageName}" يقترب من موعد نهائي SLA بتاريخ ${slaDeadline}. يرجى المراجعة.`,
        link: `/workflow/inbox`,
        groupKey: `workflow-${instanceId}`
      };
    }
    
    return {
      titleEn: 'SLA Warning',
      titleAr: 'تحذير SLA',
      bodyEn: `Workflow "${workflowName}" at stage "${stageName}" is approaching its SLA deadline of ${slaDeadline}. Please review.`,
      bodyAr: `سير العمل "${workflowName}" في مرحلة "${stageName}" يقترب من موعد نهائي SLA بتاريخ ${slaDeadline}. يرجى المراجعة.`,
      link: `/workflow/inbox`,
      groupKey: `workflow-${instanceId}`
    };
  },
  
  renderEmail(payload, lang) {
    const { workflowName, stageName, slaDeadline } = payload;
    const subject = lang === 'ar' 
      ? `تحذير SLA: ${workflowName}`
      : `SLA Warning: ${workflowName}`;
    
    const html = lang === 'ar' ? `
      <div style="direction: rtl; text-align: right;">
        <h2>تحذير SLA</h2>
        <p>مرحباً،</p>
        <p>سير العمل <strong>${workflowName}</strong> في مرحلة <strong>${stageName}</strong> يقترب من الموعد النهائي.</p>
        <p><strong>الموعد النهائي:</strong> ${slaDeadline}</p>
        <p>يرجى مراجعة سير العمل واتخاذ الإجراء اللازم لتجنب تجاوز SLA.</p>
      </div>
    ` : `
      <h2>SLA Warning</h2>
      <p>Hello,</p>
      <p>Workflow <strong>${workflowName}</strong> at stage <strong>${stageName}</strong> is approaching its deadline.</p>
      <p><strong>Deadline:</strong> ${slaDeadline}</p>
      <p>Please review the workflow and take action to avoid SLA breach.</p>
    `;
    
    const text = lang === 'ar'
      ? `سير العمل ${workflowName} في مرحلة ${stageName} يقترب من الموعد النهائي ${slaDeadline}.`
      : `Workflow ${workflowName} at stage ${stageName} is approaching deadline ${slaDeadline}.`;
    
    return { subject, html, text };
  }
};
