const fs = require('fs');

// Read the original file
const content = fs.readFileSync('notificationGateway.js', 'utf8');

// Define the new logging function
const newLogFunction = `
        // Log email notification to notification_logs collection
        await logNotificationActivity({
          trigger,
          userId,
          role,
          channel: NOTIFICATION_CHANNELS.EMAIL,
          success: emailResult.success,
          details: {
            title: details.title,
            message: details.message,
            templateId: templateId,
            variables: {
              ...details.variables,
              siteName: 'QAF Learning Hub',
              siteUrl: window.location.origin
            },
            messageId: emailResult.messageId || 'unknown',
            email: details.email
          }
        });

        results[NOTIFICATION_CHANNELS.EMAIL] = emailResult.success ? {
          success: true,
          messageId: emailResult.messageId || 'unknown',
          timestamp: new Date().toISOString()
        } : {
          success: false,
          error: emailResult.error || 'Email sending failed',
          timestamp: new Date().toISOString()
        };
`;

// Replace the old logNotificationActivity call with the new one
const updatedContent = content.replace(
  /await logNotificationActivity\({[\s\S]+?trigger,\s*userId,\s*role,\s*results,\s*settings,\s*details:\s*{\s*title:\s*details\.title,\s*message:\s*details\.message,\s*templateId:\s*templateId,\s*variables:\s*{\s*\.\.\.\.},\s*siteName:\s*'QAF Learning Hub',\s*siteUrl:\s*window\.location\.origin\s*\},\s*messageId:\s*emailResult\.messageId\s*\|\s*'unknown',\s*email:\s*details\.email\s*\}\s*}\s*}\s*};/g,
  newLogFunction
);

// Write the updated content back to the file
fs.writeFileSync('notificationGateway.js', updatedContent, 'utf8');

console.log('Updated notificationGateway.js to include email logging in notification_logs collection');
