/**
 * Workflow SLA Overdue Template
 * 
 * Event: workflow.sla_overdue
 * Category: WORKFLOW
 * Default Priority: URGENT
 */

import { CATEGORIES, PRIORITIES } from '../constants.js';

export default {
  event: 'workflow.sla_overdue',
  category: CATEGORIES.WORKFLOW,
  defaultPriority: PRIORITIES.URGENT,
  
  render(payload, lang) {
    const { workflowName, stageName, instanceId, slaDeadline } = payload;
    
    if (lang === 'ar') {
      return {
        titleEn: 'SLA Overdue',
        titleAr: `تجاوز SLA: ${workflowName}`,
        bodyEn: `Workflow "${workflowName}" at stage "${stageName}" has exceeded its SLA deadline of ${slaDeadline}. Immediate action required.`,
        bodyAr: `تجاوز سير العمل "${workflowName}" في مرحلة "${stageName}" الموعد النهائي SLA بتاريخ ${slaDeadline}. يتطلب إجراء فوري.`,
        link: `/workflow/inbox`,
        groupKey: `workflow-${instanceId}`
      };
    }
    
    return {
      titleEn: 'SLA Overdue',
      titleAr: 'تجاوز SLA',
      bodyEn: `Workflow "${workflowName}" at stage "${stageName}" has exceeded its SLA deadline of ${slaDeadline}. Immediate action required.`,
      bodyAr: `تجاوز سير العمل "${workflowName}" في مرحلة "${stageName}" الموعد النهائي SLA بتاريخ ${slaDeadline}. يتطلب إجراء فوري.`,
      link: `/workflow/inbox`,
      groupKey: `workflow-${instanceId}`
    };
  },
  
  renderEmail(payload, lang) {
    const { workflowName, stageName, slaDeadline } = payload;
    const subject = lang === 'ar' 
      ? `تجاوز SLA: ${workflowName}`
      : `SLA Overdue: ${workflowName}`;
    
    const html = lang === 'ar' ? `
      <div style="direction: rtl; text-align: right;">
        <h2 style="color: #dc2626;">تجاوز SLA</h2>
        <p>مرحباً،</p>
        <p>تجاوز سير العمل <strong>${workflowName}</strong> في مرحلة <strong>${stageName}</strong> الموعد النهائي.</p>
        <p><strong>الموعد النهائي:</strong> ${slaDeadline}</p>
        <p style="color: #dc2626; font-weight: bold;">يتطلب إجراء فوري لتجنب المزيد من التأخير.</p>
      </div>
    ` : `
      <h2 style="color: #dc2626;">SLA Overdue</h2>
      <p>Hello,</p>
      <p>Workflow <strong>${workflowName}</strong> at stage <strong>${stageName}</strong> has exceeded its deadline.</p>
      <p><strong>Deadline:</strong> ${slaDeadline}</p>
      <p style="color: #dc2626; font-weight: bold;">Immediate action required to avoid further delays.</p>
    `;
    
    const text = lang === 'ar'
      ? `تجاوز سير العمل ${workflowName} في مرحلة ${stageName} الموعد النهائي ${slaDeadline}. يتطلب إجراء فوري.`
      : `Workflow ${workflowName} at stage ${stageName} has exceeded deadline ${slaDeadline}. Immediate action required.`;
    
    return { subject, html, text };
  }
};
