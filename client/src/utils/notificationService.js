import { addNotification } from '../firebase/notifications';
import { sendEmail } from '../firebase/firestore';

/**
 * Send a notification and/or email to a student
 * @param {Object} params
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.email - Recipient email
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.type - Notification type (attendance, behavior, etc.)
 * @param {string} params.templateId - Email template ID
 * @param {Object} params.variables - Template variables
 * @param {boolean} params.sendSystem - Whether to send system notification
 * @param {boolean} params.sendEmail - Whether to send email
 */
export const sendStudentNotification = async ({
  userId,
  email,
  title,
  message,
  type,
  templateId,
  variables,
  sendSystem = true,
  sendEmailNotification = true
}) => {
  const results = {
    system: null,
    email: null
  };

  // 1. Send system notification
  if (sendSystem && userId) {
    try {
      results.system = await addNotification({
        userId,
        title,
        message,
        type,
        metadata: {
          ...variables,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending system notification:', error);
      results.system = { success: false, error: error.message };
    }
  }

  // 2. Send email notification
  if (sendEmailNotification && email && templateId) {
    try {
      results.email = await sendEmail({
        to: email,
        templateId,
        variables: {
          ...variables,
          link: window.location.origin + '/dashboard',
          siteName: 'CS Learning Hub',
          currentDate: new Date().toLocaleDateString('en-GB')
        }
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      results.email = { success: false, error: error.message };
    }
  }

  return results;
};
