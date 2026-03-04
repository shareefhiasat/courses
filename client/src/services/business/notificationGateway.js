import { addNotification } from './notificationService';
import { sendEmail } from './emailService';
import { sendViaGmailFallback } from './emailService';
import { sendEmailWithFallbacks } from './emailFallbackService';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { EMAIL_TEMPLATE_TYPES } from '@constants/templateTypes';
import { DICT } from '@contexts/LangContext';
import { logNotificationActivity } from './notificationService';
import logger from '@utils/logger';

/**
 * Smart Notification Gateway
 * Centralized service to handle all application notifications (Web, Email, SMS, WhatsApp)
 * based on role-based settings and triggers.
 */
export const notificationGateway = {
  /**
   * Send a smart notification based on trigger type
   * @param {string} trigger - One of NOTIFICATION_TRIGGERS
   * @param {Object} data - Notification data (userId, role, classId, email, variables, etc.)
   */
  async send(trigger, data) {
    const { userId, role, classId, ...details } = data;
    // Determine language: priority data.lang > user.lang (not available here) > default 'en'
    const lang = data.lang || 'en'; 
    
    try {
      // 1. Fetch settings for this role and trigger
      const settings = await this.getSettings(role, trigger);
      
      const results = {
        [NOTIFICATION_CHANNELS.WEB]: null,
        [NOTIFICATION_CHANNELS.EMAIL]: null,
        [NOTIFICATION_CHANNELS.SMS]: null,
        [NOTIFICATION_CHANNELS.WHATSAPP]: null
      };

      // 2. Handle Web Notification (Localized via LangContext)
      if (settings.web && userId) {
        // Get localized message from LangContext dictionary
        const titleKey = `notify.${trigger}.title`;
        const messageKey = `notify.${trigger}.message`;
        
        let title = this.getLocalizedText(lang, titleKey, details.variables) || details.title;
        let message = this.getLocalizedText(lang, messageKey, details.variables) || details.message;

        const webResult = await addNotification({
          userId,
          title,
          message,
          type: details.type || 'info',
          classId,
          metadata: { ...details.variables, trigger, sentAt: new Date().toISOString() }
        });

        results[NOTIFICATION_CHANNELS.WEB] = webResult;

        // Log web notification activity
        await logNotificationActivity({
          trigger,
          userId,
          role,
          channel: NOTIFICATION_CHANNELS.WEB,
          success: webResult.success,
          details: {
            title: title || 'Notification',
            message: message || 'A new notification is available',
            variables: details.variables
          }
        });
      }

      // 3. Handle Email Notification (Bilingual Support)
      // Check if trigger has a mapped template or use provided one
      const templateId = details.templateId || this.getMappedTemplate(trigger);
      
      console.log('🔍 DEBUG: Notification gateway - trigger:', trigger);
      console.log('🔍 DEBUG: Notification gateway - provided templateId:', details.templateId);
      console.log('🔍 DEBUG: Notification gateway - getMappedTemplate() result:', this.getMappedTemplate(trigger));
      console.log('🔍 DEBUG: Notification gateway - final templateId:', templateId);
      console.log('🔍 DEBUG: Notification gateway - email settings check:', settings.email);
      console.log('🔍 DEBUG: Notification gateway - recipient email:', details.email);
      console.log('🔍 DEBUG: Notification gateway - will send email:', !!(settings.email && details.email));

      if (settings.email && details.email) {
        // Get bilingual content for email templates
        const titleEn = this.getLocalizedText('en', `notify.${trigger}.title`, details.variables) || details.title || 'Notification';
        const messageEn = this.getLocalizedText('en', `notify.${trigger}.message`, details.variables) || details.message || 'You have a new notification.';
        const titleAr = this.getLocalizedText('ar', `notify.${trigger}.title`, details.variables) || details.title || 'إشعار';
        const messageAr = this.getLocalizedText('ar', `notify.${trigger}.message`, details.variables) || details.message || 'لديك إشعار جديد.';

        let emailResult;
        
        try {
          // Try primary email sending first
          console.log('📧 Attempting primary email sending via Gmail fallback...');
          emailResult = await sendViaGmailFallback({
            to: details.email,
            subject: titleEn || 'Notification',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  ${titleEn || 'Notification'}
                </h2>
                <p>${messageEn || 'You have a new notification.'}</p>
                
                ${details.variables ? `
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="color: #374151; margin-top: 0;">Details</h3>
                  ${Object.entries(details.variables).map(([key, value]) => 
                    `<p><strong>${key}:</strong> ${value}</p>`
                  ).join('')}
                </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                  <p style="color: #6b7280; margin: 0;">
                    This notification was sent from QAF Learning Hub
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  This email was sent by QAF Learning Hub. If you have questions, please contact support.
                </p>
              </div>
            `,
            text: `${titleEn || 'Notification'}\n\n${messageEn || 'You have a new notification.'}\n\n${details.variables ? 
              Object.entries(details.variables).map(([key, value]) => `${key}: ${value}`).join('\n') : 
              ''}\n\nThis notification was sent from QAF Learning Hub.`,
            attachments: details.variables?.csvContent ? [{
              filename: `${trigger}_${details.variables?.programName || 'attachment'}_${new Date().toISOString().split('T')[0]}.csv`,
              content: details.variables.csvContent
            }] : []
          });
          console.log('✅ Primary email sending succeeded');
        } catch (primaryError) {
          console.error('❌ Primary email sending failed:', primaryError);
          console.log('🔄 Switching to fallback email strategies...');
          
          // Use fallback strategies
          emailResult = await sendEmailWithFallbacks({
            to: details.email,
            subject: titleEn || 'Notification',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  ${titleEn || 'Notification'}
                </h2>
                <p>${messageEn || 'You have a new notification.'}</p>
                
                ${details.variables ? `
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="color: #374151; margin-top: 0;">Details</h3>
                  ${Object.entries(details.variables).map(([key, value]) => 
                    `<p><strong>${key}:</strong> ${value}</p>`
                  ).join('')}
                </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                  <p style="color: #6b7280; margin: 0;">
                    This notification was sent from QAF Learning Hub
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  This email was sent by QAF Learning Hub. If you have questions, please contact support.
                </p>
              </div>
            `,
            text: `${titleEn || 'Notification'}\n\n${messageEn || 'You have a new notification.'}\n\n${details.variables ? 
              Object.entries(details.variables).map(([key, value]) => `${key}: ${value}`).join('\n') : 
              ''}\n\nThis notification was sent from QAF Learning Hub.`
          });
          
          console.log('✅ Fallback email strategies completed');
        }

        results[NOTIFICATION_CHANNELS.EMAIL] = emailResult;

        // Log email notification activity
        await logNotificationActivity({
          trigger,
          userId,
          role,
          channel: NOTIFICATION_CHANNELS.EMAIL,
          success: emailResult.success,
          details: {
            title: details.title || titleEn || 'Email Notification',
            message: details.message || messageEn || 'An email has been sent',
            templateId,
            variables: {
              ...details.variables,
              // Log bilingual variables for debugging (camelCase)
              titleEn: titleEn,
              titleAr: titleAr,
              messageEn: messageEn,
              messageAr: messageAr,
              userLang: lang,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            recipient: details.email,
            error: emailResult.success ? null : emailResult.error
          }
        });
      }

      // 4. Future: Handle SMS/WhatsApp
      if (settings.sms && details.phoneNumber) {
        logger.log('SMS channel not yet implemented');
      }

      // 5. Success
      return { success: true, trigger, results };
    } catch (error) {
      logger.error(`Error in notificationGateway for trigger ${trigger}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get localized text with replacer support
   */
  getLocalizedText(lang, key, variables = {}) {
    try {
      let text = DICT[lang]?.[key];
      if (!text) return null;

      // Replace {variable} with actual values
      Object.keys(variables).forEach(varName => {
        const regex = new RegExp(`{${varName}}`, 'g');
        text = text.replace(regex, variables[varName]);
      });

      return text;
    } catch (e) {
      return null;
    }
  },

  /**
   * Map triggers to default email templates if not explicitly provided
   */
  getMappedTemplate(trigger) {
    console.log('🔍 DEBUG: getMappedTemplate called with trigger:', trigger);
    
    const mapping = {
      [NOTIFICATION_TRIGGERS.ACTIVITY_NEW]: EMAIL_TEMPLATE_TYPES.ACTIVITY_DEFAULT,
      [NOTIFICATION_TRIGGERS.ACTIVITY_GRADED]: EMAIL_TEMPLATE_TYPES.ACTIVITY_GRADED_DEFAULT,
      [NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW]: EMAIL_TEMPLATE_TYPES.ANNOUNCEMENT_DEFAULT,
      [NOTIFICATION_TRIGGERS.RESOURCE_NEW]: EMAIL_TEMPLATE_TYPES.RESOURCE_DEFAULT,
      [NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE]: EMAIL_TEMPLATE_TYPES.QUIZ_DEFAULT,
      [NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED]: EMAIL_TEMPLATE_TYPES.ATTENDANCE_DEFAULT,
      [NOTIFICATION_TRIGGERS.ATTENDANCE_ABSENT]: EMAIL_TEMPLATE_TYPES.ATTENDANCE_DEFAULT,
      [NOTIFICATION_TRIGGERS.PENALTY_ISSUED]: EMAIL_TEMPLATE_TYPES.PENALTY_DEFAULT,
      [NOTIFICATION_TRIGGERS.BEHAVIOR_RECORDED]: EMAIL_TEMPLATE_TYPES.BEHAVIOR_DEFAULT,
      [NOTIFICATION_TRIGGERS.PARTICIPATION_RECORDED]: EMAIL_TEMPLATE_TYPES.PARTICIPATION_DEFAULT,
      [NOTIFICATION_TRIGGERS.ENROLLMENT_CONFIRMED]: EMAIL_TEMPLATE_TYPES.QR_CODE_STUDENT,
      [NOTIFICATION_TRIGGERS.QR_CODE_SENT]: EMAIL_TEMPLATE_TYPES.QR_CODE_STUDENT,
      [NOTIFICATION_TRIGGERS.WELCOME_SIGNUP]: EMAIL_TEMPLATE_TYPES.WELCOME_DEFAULT,
      [NOTIFICATION_TRIGGERS.PASSWORD_RESET]: EMAIL_TEMPLATE_TYPES.PASSWORD_DEFAULT,
      [NOTIFICATION_TRIGGERS.CHAT_MESSAGE]: EMAIL_TEMPLATE_TYPES.CHAT_DIGEST_DEFAULT,
      [NOTIFICATION_TRIGGERS.SUMMARY_REPORT]: EMAIL_TEMPLATE_TYPES.SUMMARY_REPORT_DEFAULT
    };
    
    console.log('🔍 DEBUG: Full template mapping:', mapping);
    console.log('🔍 DEBUG: Mapping result for trigger:', trigger, '=>', mapping[trigger]);
    
    return mapping[trigger] || null;
  },

  /**
   * Get notification settings for a specific role and trigger - with performance monitoring and memoization
   * @private
   */
  getSettings: async (role, trigger) => {
    try {
      // In a real scenario, we might want to cache this or use a context
      // For now, return default settings since we don't have a config service
      const defaultSettings = { web: true, email: true };
      
      return defaultSettings; 
    } catch (error) {
      logger.warn('Failed to load notification settings, falling back to defaults:', error);
      return { web: true, email: true };
    }
  },

  /**
   * Send welcome notification to a new user
   * @param {string} email - User's email
   * @param {string} role - User's role (student, instructor, hr, admin)
   * @param {string} displayName - User's display name
   * @param {string} userId - User's ID (optional)
   * @param {string} lang - User's language (optional, defaults to 'en')
   */
  async sendWelcomeNotification(email, role, displayName = null, userId = null, lang = 'en') {
    return await this.send(NOTIFICATION_TRIGGERS.WELCOME_SIGNUP, {
      email,
      role,
      userId,
      lang,
      variables: {
        recipientName: displayName || email.split('@')[0],
        userEmail: email,
        displayName: displayName || email.split('@')[0],
        platformUrl: window.location.origin,
        siteName: 'QAF Learning Hub',
        currentDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        // Keep legacy variables for compatibility
        email,
        role,
        signupUrl: `${window.location.origin}/signup`,
        loginUrl: `${window.location.origin}/login`,
        siteUrl: window.location.origin
      }
    });
  }
};

