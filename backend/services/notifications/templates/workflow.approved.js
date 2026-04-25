/**
 * Workflow Approved Template
 * 
 * Event: workflow.approved
 * Category: WORKFLOW
 * Default Priority: NORMAL
 */

import { CATEGORIES, PRIORITIES } from '../constants.js';

export default {
  event: 'workflow.approved',
  category: CATEGORIES.WORKFLOW,
  defaultPriority: PRIORITIES.NORMAL,
  
  render(payload, lang) {
    const { workflowName, stageName, instanceId } = payload;
    
    if (lang === 'ar') {
      return {
        titleEn: 'Workflow Approved',
        titleAr: `تمت الموافقة على سير العمل: ${workflowName}`,
        bodyEn: `Your workflow "${workflowName}" has been approved at stage "${stageName}".`,
        bodyAr: `تمت الموافقة على سير العمل "${workflowName}" في مرحلة "${stageName}".`,
        link: `/workflow/inbox`,
        groupKey: `workflow-${instanceId}`
      };
    }
    
    return {
      titleEn: 'Workflow Approved',
      titleAr: 'تمت الموافقة على سير العمل',
      bodyEn: `Your workflow "${workflowName}" has been approved at stage "${stageName}".`,
      bodyAr: `تمت الموافقة على سير العمل "${workflowName}" في مرحلة "${stageName}".`,
      link: `/workflow/inbox`,
      groupKey: `workflow-${instanceId}`
    };
  },
  
  renderEmail(payload, lang) {
    const { workflowName, stageName } = payload;
    const subject = lang === 'ar' 
      ? `تمت الموافقة: ${workflowName}`
      : `Approved: ${workflowName}`;
    
    const html = lang === 'ar' ? `
      <div style="direction: rtl; text-align: right;">
        <h2>تمت الموافقة على سير العمل</h2>
        <p>مرحباً،</p>
        <p>تمت الموافقة على سير العمل <strong>${workflowName}</strong> في مرحلة <strong>${stageName}</strong>.</p>
        <p>سير العمل الآن في المرحلة التالية.</p>
      </div>
    ` : `
      <h2>Workflow Approved</h2>
      <p>Hello,</p>
      <p>Your workflow <strong>${workflowName}</strong> has been approved at stage <strong>${stageName}</strong>.</p>
      <p>The workflow is now moving to the next stage.</p>
    `;
    
    const text = lang === 'ar'
      ? `تمت الموافقة على ${workflowName} في مرحلة ${stageName}.`
      : `Your workflow ${workflowName} has been approved at stage ${stageName}.`;
    
    return { subject, html, text };
  }
};
