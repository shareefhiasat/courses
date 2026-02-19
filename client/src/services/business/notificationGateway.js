import { db } from '../other/config';
import { doc, getDoc } from 'firebase/firestore';
import { addNotification } from './notificationService';
import { sendEmail } from './emailService';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { EMAIL_TEMPLATE_TYPES } from '@constants/templateTypes';
import { DICT } from '@contexts/LangContext';
import { logNotificationActivity } from './notificationService';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

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
      console.log('🔍 DEBUG: Notification gateway - will send email:', !!(settings.email && details.email && templateId));

      if (settings.email && details.email && templateId) {
        // Get bilingual content for email templates
        const titleEn = this.getLocalizedText('en', `notify.${trigger}.title`, details.variables) || details.title || '🎓 Your Student QR Code';
        const messageEn = this.getLocalizedText('en', `notify.${trigger}.message`, details.variables) || details.message || 'Your QR code is ready! Click the link to access it instantly.';
        const titleAr = this.getLocalizedText('ar', `notify.${trigger}.title`, details.variables) || details.title || '🎓 رمز الطالب الخاص بك';
        const messageAr = this.getLocalizedText('ar', `notify.${trigger}.message`, details.variables) || details.message || 'رمز الاستجابة السريعة جاهز! انقر على الرابط للوصول إليه فوراً.';

        const emailResult = await sendEmail({
          to: details.email,
          templateId: templateId,
          userId: userId, // Pass userId for Firestore rules
          variables: {
            ...details.variables,
            // Bilingual content variables (camelCase) - for reference only
            titleEn: titleEn,
            titleAr: titleAr,
            messageEn: messageEn,
            messageAr: messageAr,
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
      [NOTIFICATION_TRIGGERS.ACTIVITY_NEW]: 'activity_default',
      [NOTIFICATION_TRIGGERS.ACTIVITY_GRADED]: 'activity_graded_default',
      [NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW]: 'announcement_default',
      [NOTIFICATION_TRIGGERS.RESOURCE_NEW]: 'resource_default',
      [NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE]: 'quiz_default', // Simplified naming
      [NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED]: 'attendance_default', // Simplified naming
      [NOTIFICATION_TRIGGERS.ATTENDANCE_ABSENT]: 'attendance_default',
      [NOTIFICATION_TRIGGERS.PENALTY_ISSUED]: 'penalty_default', // Simplified naming
      [NOTIFICATION_TRIGGERS.BEHAVIOR_RECORDED]: 'behavior_default', // Simplified naming
      [NOTIFICATION_TRIGGERS.PARTICIPATION_RECORDED]: 'participation_default', // Simplified naming
      [NOTIFICATION_TRIGGERS.ENROLLMENT_CONFIRMED]: EMAIL_TEMPLATE_TYPES.QR_CODE_STUDENT, // Use constant
      [NOTIFICATION_TRIGGERS.QR_CODE_SENT]: EMAIL_TEMPLATE_TYPES.QR_CODE_STUDENT, // Use constant
      [NOTIFICATION_TRIGGERS.PASSWORD_RESET]: EMAIL_TEMPLATE_TYPES.PASSWORD_DEFAULT, // Use constant
      [NOTIFICATION_TRIGGERS.CHAT_MESSAGE]: 'chat_digest_default'
    };
    
    console.log('🔍 DEBUG: Full template mapping:', mapping);
    console.log('🔍 DEBUG: Mapping result for trigger:', trigger, '=>', mapping[trigger]);
    
    return mapping[trigger] || null;
  },

  /**
   * Get notification settings for a specific role and trigger - with performance monitoring and memoization
   * @private
   */
  getSettings: withPerformanceMonitoring(
    memoize(async (role, trigger) => {
      try {
        // In a real scenario, we might want to cache this or use a context
        const settingsDoc = await getDoc(doc(db, 'config', 'notificationSettings'));
        const settings = settingsDoc.exists() ? settingsDoc.data() : {};
        
        return settings[role]?.[trigger] || { web: true, email: true }; 
      } catch (error) {
        logger.warn('Failed to load notification settings, falling back to defaults:', error);
        return { web: true, email: true };
      }
    }),
    'getSettings'
  ),
};

