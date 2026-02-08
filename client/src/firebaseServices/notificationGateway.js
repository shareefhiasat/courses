import { db } from './config';
import { doc, getDoc } from 'firebase/firestore';
import { addNotification } from './notificationService';
import { sendEmail } from './emailService';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { DICT } from '@contexts/LangContext';
import { logNotificationActivity } from './notificationService';

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
            title,
            message,
            variables: details.variables
          }
        });
      }

      // 3. Handle Email Notification (Bilingual Support)
      // Check if trigger has a mapped template or use provided one
      const templateId = details.templateId || this.getMappedTemplate(trigger);

      if (settings.email && details.email && templateId) {
        // Get bilingual content for email templates
        const titleEn = this.getLocalizedText('en', `notify.${trigger}.title`, details.variables) || details.title;
        const messageEn = this.getLocalizedText('en', `notify.${trigger}.message`, details.variables) || details.message;
        const titleAr = this.getLocalizedText('ar', `notify.${trigger}.title`, details.variables) || details.title;
        const messageAr = this.getLocalizedText('ar', `notify.${trigger}.message`, details.variables) || details.message;

        const emailResult = await sendEmail({
          to: details.email,
          templateId: templateId,
          variables: {
            ...details.variables,
            // Bilingual content variables (camelCase)
            titleEn: titleEn,
            titleAr: titleAr,
            messageEn: messageEn,
            messageAr: messageAr,
            // Fallback variables (for backward compatibility)
            title: titleEn,
            message: messageEn,
            // System variables
            siteName: 'QAF Learning Hub',
            siteUrl: window.location.origin,
            userLang: lang, // User's preferred language
            createdAt: new Date().toISOString(), // Qatar timezone will be applied by server
            updatedAt: new Date().toISOString()  // Qatar timezone will be applied by server
          }
        });

        results[NOTIFICATION_CHANNELS.EMAIL] = emailResult;

        // Log email notification activity
        await logNotificationActivity({
          trigger,
          userId,
          role,
          channel: NOTIFICATION_CHANNELS.EMAIL,
          success: emailResult.success,
          details: {
            title: details.title,
            message: details.message,
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
        console.log('SMS channel not yet implemented');
      }

      // 5. Success
      return { success: true, trigger, results };
    } catch (error) {
      console.error(`Error in notificationGateway for trigger ${trigger}:`, error);
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
    const mapping = {
      [NOTIFICATION_TRIGGERS.ACTIVITY_NEW]: 'activityNew',
      [NOTIFICATION_TRIGGERS.ACTIVITY_GRADED]: 'activityGraded',
      [NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW]: 'announcementNew',
      [NOTIFICATION_TRIGGERS.RESOURCE_NEW]: 'resourceNew',
      [NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE]: 'quizAvailable',
      [NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED]: 'attendanceNotification',
      [NOTIFICATION_TRIGGERS.ATTENDANCE_ABSENT]: 'attendanceNotification',
      [NOTIFICATION_TRIGGERS.PENALTY_ISSUED]: 'penaltyNotification',
      [NOTIFICATION_TRIGGERS.BEHAVIOR_RECORDED]: 'behaviorNotification',
      [NOTIFICATION_TRIGGERS.PARTICIPATION_RECORDED]: 'participationNotification',
      [NOTIFICATION_TRIGGERS.PASSWORD_RESET]: 'passwordReset',
      [NOTIFICATION_TRIGGERS.CHAT_MESSAGE]: 'chatMessage'
    };
    return mapping[trigger] || null;
  },

  /**
   * Get notification settings for a specific role and trigger
   * @private
   */
  async getSettings(role, trigger) {
    try {
      // In a real scenario, we might want to cache this or use a context
      const settingsDoc = await getDoc(doc(db, 'config', 'notificationSettings'));
      const settings = settingsDoc.exists() ? settingsDoc.data() : {};
      
      return settings[role]?.[trigger] || { web: true, email: true }; 
    } catch (error) {
      console.warn('Failed to load notification settings, falling back to defaults:', error);
      return { web: true, email: true };
    }
  }
};
