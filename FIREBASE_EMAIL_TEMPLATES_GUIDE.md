# 📧 FIREBASE EMAIL TEMPLATES CONFIGURATION GUIDE

**QAF Learning Hub - Customizing Firebase Authentication Email Templates**

---

## 🎯 OVERVIEW

Firebase Authentication sends automatic emails for:
1. **Email Verification** - When users sign up
2. **Password Reset** - When users forget password
3. **Email Change** - When users update their email
4. **SMS Verification** - For phone authentication (if enabled)

These templates can be customized in the Firebase Console to match your branding.

---

## 🚀 HOW TO ACCESS EMAIL TEMPLATES

### **Step 1: Go to Firebase Console**
1. Open: https://console.firebase.google.com/
2. Select your project: **main-one-32026**
3. Click **Authentication** in the left sidebar
4. Click **Templates** tab at the top

### **Step 2: Select Template Type**
You'll see tabs for:
- **Email address verification**
- **Password reset**
- **Email change**
- **SMS verification**

---

## 🎨 CUSTOMIZING EMAIL TEMPLATES

### **1. Email Verification Template**

#### **Default Firebase Template:**
```
Subject: Verify your email for %APP_NAME%

Body:
Hello,

Follow this link to verify your email address.

%LINK%

If you didn't ask to verify this address, you can ignore this email.

Thanks,
Your %APP_NAME% team
```

#### **Customized for QAF Learning Hub:**

**Subject:**
```
✅ Verify Your Email - QAF Learning Hub
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #800020, #600018); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
    .button { display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 0.9rem; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎓 QAF Learning Hub</h1>
      <p style="margin: 10px 0 0 0;">Welcome to Your Learning Journey</p>
    </div>
    
    <div class="content">
      <h2 style="color: #800020;">Verify Your Email Address</h2>
      <p>Hello,</p>
      <p>Thank you for joining QAF Learning Hub! To complete your registration and access all features, please verify your email address.</p>
      
      <div style="text-align: center;">
        <a href="%LINK%" class="button">✅ Verify Email Address</a>
      </div>
      
      <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
      <p style="background: #f8f9fa; padding: 10px; border-radius: 6px; word-break: break-all; font-size: 0.9rem;">%LINK%</p>
      
      <p style="margin-top: 20px; color: #666; font-size: 0.9rem;">
        <strong>Note:</strong> If you didn't create an account with QAF Learning Hub, you can safely ignore this email.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">© 2025 QAF Learning Hub. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">Questions? Contact us at shareef.hiasat@gmail.com</p>
    </div>
  </div>
</body>
</html>
```

---

### **2. Password Reset Template**

#### **Customized for QAF Learning Hub:**

**Subject:**
```
🔑 Reset Your Password - QAF Learning Hub
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #800020, #600018); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
    .button { display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 6px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 0.9rem; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎓 QAF Learning Hub</h1>
      <p style="margin: 10px 0 0 0;">Password Reset Request</p>
    </div>
    
    <div class="content">
      <h2 style="color: #800020;">Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password for your QAF Learning Hub account.</p>
      
      <div style="text-align: center;">
        <a href="%LINK%" class="button">🔑 Reset Password</a>
      </div>
      
      <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
      <p style="background: #f8f9fa; padding: 10px; border-radius: 6px; word-break: break-all; font-size: 0.9rem;">%LINK%</p>
      
      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this, please ignore this email</li>
          <li>Your password will remain unchanged</li>
        </ul>
      </div>
      
      <p style="margin-top: 20px; color: #666; font-size: 0.9rem;">
        For security reasons, we recommend using a strong password that includes uppercase letters, lowercase letters, numbers, and special characters.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">© 2025 QAF Learning Hub. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">Questions? Contact us at support@qaflms.com</p>
    </div>
  </div>
</body>
</html>
```

---

### **3. Email Change Template**

**Subject:**
```
📧 Verify Your New Email - QAF Learning Hub
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #800020, #600018); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #ddd; }
    .button { display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 6px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 0.9rem; color: #666; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎓 QAF Learning Hub</h1>
      <p style="margin: 10px 0 0 0;">Email Change Verification</p>
    </div>
    
    <div class="content">
      <h2 style="color: #800020;">Verify Your New Email Address</h2>
      <p>Hello,</p>
      <p>You recently requested to change the email address associated with your QAF Learning Hub account.</p>
      
      <div class="info-box">
        <strong>📧 New Email Address:</strong> %NEW_EMAIL%
      </div>
      
      <p>To complete this change, please verify your new email address:</p>
      
      <div style="text-align: center;">
        <a href="%LINK%" class="button">📧 Verify New Email</a>
      </div>
      
      <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
      <p style="background: #f8f9fa; padding: 10px; border-radius: 6px; word-break: break-all; font-size: 0.9rem;">%LINK%</p>
      
      <p style="margin-top: 20px; color: #666; font-size: 0.9rem;">
        <strong>Note:</strong> If you didn't request this change, please contact support immediately at support@qaflms.com
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">© 2025 QAF Learning Hub. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">Questions? Contact us at support@qaflms.com</p>
    </div>
  </div>
</body>
</html>
```

---

## 📝 STEP-BY-STEP: UPDATING TEMPLATES IN FIREBASE CONSOLE

### **For Each Template:**

1. **Go to Firebase Console** → Authentication → Templates

2. **Click on the template** you want to edit (e.g., "Email address verification")

3. **Edit the fields:**
   - **From name:** `QAF Learning Hub`
   - **From email:** Your verified sender email (e.g., `noreply@qaflms.com`)
   - **Reply-to email:** Your support email (e.g., `support@qaflms.com`)
   - **Subject:** Copy from above
   - **Body:** Copy the HTML from above

4. **Use these variables** (Firebase will replace them):
   - `%LINK%` - Verification/reset link
   - `%APP_NAME%` - Your app name
   - `%EMAIL%` - User's email
   - `%NEW_EMAIL%` - New email (for email change)

5. **Click "Save"**

6. **Test the template:**
   - Click "Send test email"
   - Enter your email
   - Check if it looks correct

---

## 🎨 BRANDING COLORS

Use these colors to match your QAF Learning Hub branding:

```css
/* Primary Maroon */
--primary: #800020;
--primary-dark: #600018;

/* Gradients */
background: linear-gradient(135deg, #800020, #600018);

/* Accent Colors */
--success: #28a745;
--warning: #ffc107;
--info: #2196F3;
--danger: #dc3545;
```

---

## 📧 SMTP SENDER CONFIGURATION

### **Before You Can Send Custom Emails:**

1. **Verify Your Domain** (Recommended):
   - Go to Firebase Console → Authentication → Templates → SMTP Settings
   - Add your domain (e.g., `qaflms.com`)
   - Add DNS records to verify ownership
   - This allows sending from `noreply@qaflms.com`

2. **Or Use Firebase Default:**
   - Emails will come from `noreply@[your-project].firebaseapp.com`
   - No verification needed
   - Less professional

### **Custom SMTP (Alternative):**
If you want full control, you can use your own SMTP server:
- Already configured in Dashboard → SMTP tab
- Used for newsletters and custom emails
- Firebase auth emails still use Firebase SMTP

---

## 🔧 VARIABLES REFERENCE

### **Available in All Templates:**
- `%APP_NAME%` - Your app name (set in Firebase Console)
- `%LINK%` - Action link (verification, reset, etc.)
- `%EMAIL%` - User's current email

### **Email Change Only:**
- `%NEW_EMAIL%` - The new email address

### **Custom Variables (Not Supported):**
Firebase auth templates don't support custom variables. For fully custom emails with variables, use the Newsletter system in your Dashboard.

---

## 📱 MOBILE-RESPONSIVE TEMPLATE

The templates above are already mobile-responsive, but here's a simplified version if needed:

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #800020, #600018); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: #800020; color: white; text-decoration: none; border-radius: 6px; }
    @media only screen and (max-width: 600px) {
      .content { padding: 15px; }
      .button { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 QAF Learning Hub</h1>
    </div>
    <div class="content">
      <!-- Your content here -->
      <a href="%LINK%" class="button">Take Action</a>
    </div>
  </div>
</body>
</html>
```

---

## ✅ CHECKLIST

- [ ] Access Firebase Console → Authentication → Templates
- [ ] Update Email Verification template
- [ ] Update Password Reset template
- [ ] Update Email Change template
- [ ] Set "From name" to "QAF Learning Hub"
- [ ] Set reply-to email
- [ ] Test each template by sending test email
- [ ] Verify branding matches (maroon colors, logo)
- [ ] Check mobile responsiveness
- [ ] Update support email in footers

---

## 🚨 IMPORTANT NOTES

1. **HTML Support:** Firebase supports HTML emails, so use the full templates above

2. **Link Expiration:**
   - Email verification: Never expires
   - Password reset: 1 hour
   - Email change: 1 hour

3. **Localization:** Firebase doesn't support multi-language auth emails natively. You'd need to:
   - Detect user language preference
   - Use Cloud Functions to send custom emails
   - Or keep English as default

4. **Testing:** Always send test emails before going live!

5. **Spam Filters:** 
   - Avoid too many images
   - Don't use all caps in subject
   - Include plain text alternative
   - Verify your domain

---

## 📚 ADDITIONAL RESOURCES

- **Firebase Auth Email Templates:** https://firebase.google.com/docs/auth/custom-email-handler
- **Email Best Practices:** https://developers.google.com/gmail/design/reference/supported_css
- **HTML Email Guide:** https://www.campaignmonitor.com/css/

---

## 🎯 QUICK START

**Fastest way to update:**

1. Go to: https://console.firebase.google.com/project/main-one-32026/authentication/emails

2. For each template, paste this minimal version:

**Subject:** `%ACTION% - QAF Learning Hub`

**Body:**
```html
<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#800020,#600018);color:white;padding:30px;text-align:center;border-radius:12px 12px 0 0">
    <h1>🎓 QAF Learning Hub</h1>
  </div>
  <div style="background:white;padding:30px;border:1px solid #ddd">
    <p>Hello,</p>
    <p>Click the button below to continue:</p>
    <div style="text-align:center;margin:30px 0">
      <a href="%LINK%" style="display:inline-block;padding:15px 35px;background:linear-gradient(135deg,#800020,#600018);color:white;text-decoration:none;border-radius:8px;font-weight:bold">Continue</a>
    </div>
    <p style="color:#666;font-size:0.9rem">If you didn't request this, you can ignore this email.</p>
  </div>
  <div style="background:#f8f9fa;padding:20px;text-align:center;font-size:0.9rem;color:#666;border-radius:0 0 12px 12px">
    <p>© 2025 QAF Learning Hub</p>
  </div>
</div>
```

3. Click Save

Done! ✅
