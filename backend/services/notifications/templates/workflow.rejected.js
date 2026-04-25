/**
 * Workflow Rejected Template
 * 
 * Event: workflow.rejected
 * Category: WORKFLOW
 * Default Priority: HIGH
 */

import { CATEGORIES, PRIORITIES } from '../constants.js';

export default {
  event: 'workflow.rejected',
  category: CATEGORIES.WORKFLOW,
  defaultPriority: PRIORITIES.HIGH,
  
  render(payload, lang) {
    const { workflowName, stageName, instanceId, reason } = payload;
    
    if (lang === 'ar') {
      return {
        titleEn: 'Workflow Rejected',
        titleAr: `تم رفض سير العمل: ${workflowName}`,
        bodyEn: `Your workflow "${workflowName}" has been rejected at stage "${stageName}"${reason ? `. Reason: ${reason}` : ''}.`,
        bodyAr: `تم رفض سير العمل "${workflowName}" في مرحلة "${stageName}"${reason ? `. السبب: ${reason}` : ''}.`,
        link: `/workflow/inbox`,
        groupKey: `workflow-${instanceId}`
      };
    }
    
    return {
      titleEn: 'Workflow Rejected',
      titleAr: 'تم رفض سير العمل',
      bodyEn: `Your workflow "${workflowName}" has been rejected at stage "${stageName}"${reason ? `. Reason: ${reason}` : ''}.`,
      bodyAr: `تم رفض سير العمل "${workflowName}" في مرحلة "${stageName}"${reason ? `. السبب: ${reason}` : ''}.`,
      link: `/workflow/inbox`,
      groupKey: `workflow-${instanceId}`
    };
  },
  
  renderEmail(payload, lang) {
    const { workflowName, stageName, reason } = payload;
    const subject = lang === 'ar' 
      ? `تم الرفض: ${workflowName}`
      : `Rejected: ${workflowName}`;
    
    const html = lang === 'ar' ? `
      <div style="direction: rtl; text-align: right;">
        <h2>تم رفض سير العمل</h2>
        <p>مرحباً،</p>
        <p>تم رفض سير العمل <strong>${workflowName}</strong> في مرحلة <strong>${stageName}</strong>.</p>
        ${reason ? `<p><strong>السبب:</strong> ${reason}</p>` : ''}
        <p>يرجى مراجعة سير العمل وإجراء التعديلات اللازمة.</p>
      </div>
    ` : `
      <h2>Workflow Rejected</h2>
      <p>Hello,</p>
      <p>Your workflow <strong>${workflowName}</strong> has been rejected at stage <strong>${stageName}</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please review the workflow and make necessary corrections.</p>
    `;
    
    const text = lang === 'ar'
      ? `تم رفض ${workflowName} في مرحلة ${stageName}${reason ? `. السبب: ${reason}` : ''}.`
      : `Your workflow ${workflowName} has been rejected at stage ${stageName}${reason ? `. Reason: ${reason}` : ''}.`;
    
    return { subject, html, text };
  }
};
