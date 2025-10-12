# 🔥 Firebase Email Templates Configuration Guide
## QAF Learning Hub - Complete Setup Instructions

---

## 📋 Overview

This guide will help you configure all email templates in Firebase Authentication for the QAF Learning Hub platform.

**Branding Details:**
- **Sender Name:** QAF Learning Hub
- **Sender Email:** shareef.hiasat@gmail.com
- **Reply-To:** shareef.hiasat@gmail.com
- **Domain:** main-one-32026.web.app
- **Firebase Email:** noreply@main-one-32026.firebaseapp.com

---

## 🚀 How to Access Email Templates

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **main-one-32026**
3. Click **Authentication** in the left sidebar
4. Click **Templates** tab at the top
5. You'll see 4 email templates to configure

---

## 📧 Template 1: Email Address Verification

**When it's sent:** When a user signs up and needs to verify their email address.

### Configuration:

**Sender Name:** `QAF Learning Hub`

**From Email:** `noreply@main-one-32026.firebaseapp.com`

**Reply-To:** `shareef.hiasat@gmail.com`

**Subject:**
```
Verify your email for QAF Learning Hub
```

**Message (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">QAF Learning Hub</h1>
              <p style="color: #FFD700; margin: 10px 0 0 0; font-size: 14px;">Excellence in Computer Science Education</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #800020; margin: 0 0 20px 0;">Hello %DISPLAY_NAME%,</h2>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Welcome to QAF Learning Hub! We're excited to have you join our community of learners.
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                To get started, please verify your email address by clicking the button below:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="%LINK%" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #800020, #600018); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      ✓ Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #800020; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                %LINK%
              </p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't create an account with QAF Learning Hub, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>QAF Learning Hub</strong><br>
                Excellence in Computer Science Education
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                <a href="https://main-one-32026.web.app" style="color: #800020; text-decoration: none;">Visit Website</a> | 
                <a href="mailto:shareef.hiasat@gmail.com" style="color: #800020; text-decoration: none;">Contact Support</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Action URL:** `https://main-one-32026.web.app/__/auth/action`

---

## 🔑 Template 2: Password Reset

**When it's sent:** When a user requests to reset their password.

### Configuration:

**Sender Name:** `QAF Learning Hub`

**From Email:** `noreply@main-one-32026.firebaseapp.com`

**Reply-To:** `shareef.hiasat@gmail.com`

**Subject:**
```
Reset your password for QAF Learning Hub
```

**Message (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">QAF Learning Hub</h1>
              <p style="color: #FFD700; margin: 10px 0 0 0; font-size: 14px;">Excellence in Computer Science Education</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #800020; margin: 0 0 20px 0;">Hello,</h2>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password for your QAF Learning Hub account (<strong>%EMAIL%</strong>).
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Click the button below to reset your password:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="%LINK%" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #800020, #600018); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      🔑 Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #800020; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                %LINK%
              </p>
              
              <div style="background-color: #fff8dc; border-left: 4px solid #FFD700; padding: 15px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⚠️ Security Notice:</strong><br>
                  If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
                </p>
              </div>
              
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0;">
                This link will expire in 1 hour for security reasons.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>QAF Learning Hub</strong><br>
                Excellence in Computer Science Education
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                <a href="https://main-one-32026.web.app" style="color: #800020; text-decoration: none;">Visit Website</a> | 
                <a href="mailto:shareef.hiasat@gmail.com" style="color: #800020; text-decoration: none;">Contact Support</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Action URL:** `https://main-one-32026.web.app/__/auth/action`

---

## 📧 Template 3: Email Address Change

**When it's sent:** When a user changes their email address.

### Configuration:

**Sender Name:** `QAF Learning Hub`

**From Email:** `noreply@main-one-32026.firebaseapp.com`

**Reply-To:** `shareef.hiasat@gmail.com`

**Subject:**
```
Your sign-in email was changed for QAF Learning Hub
```

**Message (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Address Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">QAF Learning Hub</h1>
              <p style="color: #FFD700; margin: 10px 0 0 0; font-size: 14px;">Excellence in Computer Science Education</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #800020; margin: 0 0 20px 0;">Hello %DISPLAY_NAME%,</h2>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your sign-in email for QAF Learning Hub was changed to <strong>%NEW_EMAIL%</strong>.
              </p>
              
              <div style="background-color: #fff0f3; border-left: 4px solid #800020; padding: 15px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⚠️ Security Alert:</strong><br>
                  If you didn't make this change, please contact support immediately and reset your password.
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you didn't ask to change your email, follow this link to reset your sign-in email:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 20px 0;">
                    <a href="%LINK%" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #800020, #600018); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      🔄 Reset Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                Or copy and paste this link:
              </p>
              <p style="color: #800020; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                %LINK%
              </p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Thanks,<br>
                <strong>Your QAF Learning Hub team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>QAF Learning Hub</strong><br>
                Excellence in Computer Science Education
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                <a href="https://main-one-32026.web.app" style="color: #800020; text-decoration: none;">Visit Website</a> | 
                <a href="mailto:shareef.hiasat@gmail.com" style="color: #800020; text-decoration: none;">Contact Support</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Action URL:** `https://main-one-32026.web.app/__/auth/action`

---

## 🔐 Template 4: Multi-Factor Enrollment Notification

**When it's sent:** When a user adds 2-step verification to their account.

### Configuration:

**Sender Name:** `QAF Learning Hub`

**From Email:** `noreply@main-one-32026.firebaseapp.com`

**Reply-To:** `shareef.hiasat@gmail.com`

**Subject:**
```
You've added 2-step verification to your QAF Learning Hub account
```

**Message (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>2-Step Verification Added</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">QAF Learning Hub</h1>
              <p style="color: #FFD700; margin: 10px 0 0 0; font-size: 14px;">Excellence in Computer Science Education</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #800020; margin: 0 0 20px 0;">Hello %DISPLAY_NAME%,</h2>
              
              <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 0 0 20px 0;">
                <p style="color: #155724; font-size: 16px; line-height: 1.6; margin: 0;">
                  <strong>✓ Security Enhanced!</strong><br>
                  Your account in QAF Learning Hub has been updated with %SECOND_FACTOR% for 2-step verification.
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                This adds an extra layer of security to your account. From now on, you'll need to verify your identity using this second factor when signing in.
              </p>
              
              <div style="background-color: #fff0f3; border-left: 4px solid #800020; padding: 15px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⚠️ Didn't add 2-step verification?</strong><br>
                  If you didn't add this 2-step verification, click the link below to remove it immediately and secure your account.
                </p>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="%LINK%" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #800020, #600018); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      🔒 Remove 2-Step Verification
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                Or copy and paste this link:
              </p>
              <p style="color: #800020; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                %LINK%
              </p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Thanks,<br>
                <strong>Your QAF Learning Hub team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>QAF Learning Hub</strong><br>
                Excellence in Computer Science Education
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                <a href="https://main-one-32026.web.app" style="color: #800020; text-decoration: none;">Visit Website</a> | 
                <a href="mailto:shareef.hiasat@gmail.com" style="color: #800020; text-decoration: none;">Contact Support</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Action URL:** `https://main-one-32026.web.app/__/auth/action`

---

## ⚙️ SMTP Settings (Optional - For Custom Email Server)

If you want to use your own SMTP server instead of Firebase's default:

1. Go to **Authentication > Templates > SMTP settings**
2. Enable SMTP
3. Configure:
   - **Sender address:** `shareef.hiasat@gmail.com`
   - **SMTP server host:** `smtp.gmail.com` (or your provider)
   - **SMTP server port:** `587`
   - **SMTP account username:** `shareef.hiasat@gmail.com`
   - **SMTP account password:** [Your app-specific password]
   - **SMTP security mode:** `TLS`

---

## 📝 Available Variables

Firebase provides these variables you can use in your templates:

- `%DISPLAY_NAME%` - User's display name
- `%EMAIL%` - User's email address
- `%NEW_EMAIL%` - New email (for email change template)
- `%LINK%` - Action link (verify email, reset password, etc.)
- `%APP_NAME%` - Your app name (QAF Learning Hub)
- `%SECOND_FACTOR%` - Second factor method (for MFA template)

---

## ✅ Testing Your Templates

After configuring:

1. Create a test user account
2. Try each action:
   - Sign up → Check email verification
   - Request password reset → Check reset email
   - Change email → Check notification
   - Enable 2FA → Check MFA email

---

## 🎨 Brand Colors Used

- **Primary Maroon:** `#800020`
- **Dark Maroon:** `#600018`
- **Accent Gold:** `#FFD700`
- **Success Green:** `#28a745`
- **Background:** `#f5f5f5`

---

## 📞 Support

If you need help:
- **Email:** shareef.hiasat@gmail.com
- **Website:** https://main-one-32026.web.app

---

**Last Updated:** 2025-10-11
**Version:** 1.0
