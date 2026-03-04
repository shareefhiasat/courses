/**
 * Fallback Email Service
 * Used when primary email systems fail
 * Provides multiple fallback strategies
 */

/**
 * Fallback 1: Simple console/email prompt
 */
export const consoleFallbackEmail = async (emailData) => {
  console.log('📧 FALLBACK EMAIL - Console Output:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TO:', emailData.to);
  console.log('SUBJECT:', emailData.subject);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('HTML CONTENT:');
  console.log(emailData.html);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEXT CONTENT:');
  console.log(emailData.text);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Copy to clipboard for manual sending
  if (navigator.clipboard) {
    const emailContent = `
TO: ${emailData.to}
SUBJECT: ${emailData.subject}

${emailData.text}
    `.trim();
    
    try {
      await navigator.clipboard.writeText(emailContent);
      console.log('📋 Email content copied to clipboard for manual sending');
    } catch (err) {
      console.warn('⚠️ Could not copy to clipboard:', err);
    }
  }
  
  return {
    success: true,
    method: 'console_fallback',
    message: 'Email displayed in console and copied to clipboard'
  };
};

/**
 * Fallback 2: Mailto link generation
 */
export const mailtoFallbackEmail = async (emailData) => {
  const subject = encodeURIComponent(emailData.subject);
  const body = encodeURIComponent(emailData.text);
  const mailtoUrl = `mailto:${emailData.to}?subject=${subject}&body=${body}`;
  
  console.log('📧 FALLBACK EMAIL - Mailto Link:');
  console.log(mailtoUrl);
  
  // Try to open mail client
  try {
    window.open(mailtoUrl, '_blank');
    return {
      success: true,
      method: 'mailto_fallback',
      message: 'Opened mail client with pre-filled email'
    };
  } catch (err) {
    console.warn('⚠️ Could not open mail client:', err);
    return {
      success: false,
      method: 'mailto_fallback',
      error: err.message
    };
  }
};

/**
 * Fallback 3: Download email as HTML file
 */
export const downloadFallbackEmail = async (emailData) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email: ${emailData.subject}</title>
</head>
<body>
    <h2>Email Details</h2>
    <p><strong>To:</strong> ${emailData.to}</p>
    <p><strong>Subject:</strong> ${emailData.subject}</p>
    <hr>
    <div>${emailData.html}</div>
</body>
</html>
  `.trim();
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `email_${emailData.to.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📧 FALLBACK EMAIL - Downloaded HTML file');
  
  return {
    success: true,
    method: 'download_fallback',
    message: 'Email downloaded as HTML file for manual sending'
  };
};

/**
 * Master fallback function - tries multiple strategies
 */
export const sendEmailWithFallbacks = async (emailData) => {
  console.log('🔄 Starting fallback email strategies...');
  
  const fallbacks = [
    { name: 'Console Output', fn: consoleFallbackEmail },
    { name: 'Mailto Link', fn: mailtoFallbackEmail },
    { name: 'Download HTML', fn: downloadFallbackEmail }
  ];
  
  const results = [];
  
  for (const fallback of fallbacks) {
    try {
      console.log(`🔄 Trying fallback: ${fallback.name}`);
      const result = await fallback.fn(emailData);
      results.push({ ...result, fallback: fallback.name });
      console.log(`✅ Fallback succeeded: ${fallback.name}`);
    } catch (error) {
      console.error(`❌ Fallback failed: ${fallback.name}`, error);
      results.push({ 
        success: false, 
        fallback: fallback.name, 
        error: error.message 
      });
    }
  }
  
  const successful = results.filter(r => r.success);
  
  return {
    success: successful.length > 0,
    method: 'fallback_strategies',
    results,
    successfulCount: successful.length,
    message: `${successful.length} of ${fallbacks.length} fallback strategies succeeded`
  };
};

export default {
  consoleFallbackEmail,
  mailtoFallbackEmail,
  downloadFallbackEmail,
  sendEmailWithFallbacks
};
