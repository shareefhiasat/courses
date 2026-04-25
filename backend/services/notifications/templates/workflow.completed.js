/**
 * Workflow Completed Template
 * 
 * Event: workflow.completed
 * Category: WORKFLOW
 * Default Priority: NORMAL
 */

import { CATEGORIES, PRIORITIES } from '../constants.js';

export default {
  event: 'workflow.completed',
  category: CATEGORIES.WORKFLOW,
  defaultPriority: PRIORITIES.NORMAL,
  
  render(payload, lang) {
    const { workflowName, instanceId } = payload;
    
    if (lang === 'ar') {
      return {
        titleEn: 'Workflow Completed',
        titleAr: `اكتمل سير العمل: ${workflowName}`,
        bodyEn: `Your workflow "${workflowName}" has been completed successfully.`,
        bodyAr: `اكتمل سير العمل "${workflowName}" بنجاح.`,
        link: `/workflow/inbox`,
        groupKey: `workflow-${instanceId}`
      };
    }
    
    return {
      titleEn: 'Workflow Completed',
      titleAr: 'اكتمل سير العمل',
      bodyEn: `Your workflow "${workflowName}" has been completed successfully.`,
      bodyAr: `اكتمل سير العمل "${workflowName}" بنجاح.`,
      link: `/workflow/inbox`,
      groupKey: `workflow-${instanceId}`
    };
  },
  
  renderEmail(payload, lang) {
    const { workflowName } = payload;
    const subject = lang === 'ar' 
      ? `اكتمل: ${workflowName}`
      : `Completed: ${workflowName}`;
    
    const html = lang === 'ar' ? `
      <div style="direction: rtl; text-align: right;">
        <h2>اكتمل سير العمل</h2>
        <p>مرحباً،</p>
        <p>اكتمل سير العمل <strong>${workflowName}</strong> بنجاح.</p>
        <p>يمكنك الآن مراجعة سجل سير العمل.</p>
      </div>
    ` : `
      <h2>Workflow Completed</h2>
      <p>Hello,</p>
      <p>Your workflow <strong>${workflowName}</strong> has been completed successfully.</p>
      <p>You can now review the workflow history.</p>
    `;
    
    const text = lang === 'ar'
      ? `اكتمل سير العمل ${workflowName} بنجاح.`
      : `Your workflow ${workflowName} has been completed successfully.`;
    
    return { subject, html, text };
  }
};
