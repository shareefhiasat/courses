/**
 * Workflow Assigned Template
 * 
 * Event: workflow.assigned
 * Category: WORKFLOW
 * Default Priority: NORMAL
 */

import { CATEGORIES, PRIORITIES } from '../constants.js';

export default {
  event: 'workflow.assigned',
  category: CATEGORIES.WORKFLOW,
  defaultPriority: PRIORITIES.NORMAL,
  
  /**
   * Render notification content
   * @param {Object} payload - Event payload
   * @param {string} payload.workflowName - Workflow name
   * @param {string} payload.stageName - Current stage name
   * @param {number} payload.instanceId - Workflow instance ID
   * @param {string} lang - Language ('en' or 'ar')
   * @returns {Object} Rendered content
   */
  render(payload, lang) {
    const { workflowName, stageName, instanceId } = payload;
    
    if (lang === 'ar') {
      return {
        titleEn: 'New Workflow Assigned',
        titleAr: `تم تعيين سير عمل جديد: ${workflowName}`,
        bodyEn: `You have been assigned to review "${workflowName}" at stage "${stageName}".`,
        bodyAr: `تم تعيينك لمراجعة "${workflowName}" في مرحلة "${stageName}".`,
        link: `/workflow/inbox`,
        groupKey: `workflow-${instanceId}`
      };
    }
    
    return {
      titleEn: 'New Workflow Assigned',
      titleAr: 'تم تعيين سير عمل جديد',
      bodyEn: `You have been assigned to review "${workflowName}" at stage "${stageName}".`,
      bodyAr: `تم تعيينك لمراجعة "${workflowName}" في مرحلة "${stageName}".`,
      link: `/workflow/inbox`,
      groupKey: `workflow-${instanceId}`
    };
  },
  
  /**
   * Render email content
   * @param {Object} payload - Event payload
   * @param {string} lang - Language
   * @returns {Object} Email content
   */
  renderEmail(payload, lang) {
    const { workflowName, stageName, instanceId } = payload;
    const subject = lang === 'ar' 
      ? `سير عمل جديد: ${workflowName}`
      : `New Workflow: ${workflowName}`;
    
    const html = lang === 'ar' ? `
      <div style="direction: rtl; text-align: right;">
        <h2>تم تعيين سير عمل جديد</h2>
        <p>مرحباً،</p>
        <p>تم تعيينك لمراجعة <strong>${workflowName}</strong> في مرحلة <strong>${stageName}</strong>.</p>
        <p>يرجى مراجعة سير العمل واتخاذ الإجراء اللازم.</p>
        <p>
          <a href="${process.env.APP_URL || 'http://localhost:5174'}/workflow/inbox" 
             style="background: #8A1538; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            مراجعة سير العمل
          </a>
        </p>
      </div>
    ` : `
      <h2>New Workflow Assigned</h2>
      <p>Hello,</p>
      <p>You have been assigned to review <strong>${workflowName}</strong> at stage <strong>${stageName}</strong>.</p>
      <p>Please review the workflow and take the necessary action.</p>
      <p>
        <a href="${process.env.APP_URL || 'http://localhost:5174'}/workflow/inbox" 
           style="background: #8A1538; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Review Workflow
        </a>
      </p>
    `;
    
    const text = lang === 'ar'
      ? `تم تعيينك لمراجعة ${workflowName} في مرحلة ${stageName}. يرجى زيارة ${process.env.APP_URL || 'http://localhost:5174'}/workflow/inbox`
      : `You have been assigned to review ${workflowName} at stage ${stageName}. Visit ${process.env.APP_URL || 'http://localhost:5174'}/workflow/inbox`;
    
    return { subject, html, text };
  }
};
