# Bilingual Email Template Examples

## 🌍 Bilingual Email Variables

The notification system now automatically provides bilingual variables for all email templates. You can use any of these variables in your email templates as needed.

### 📧 Available Variables

#### **Bilingual Content Variables:**
```html
<!-- English content -->
{{title_en}}
{{message_en}}

<!-- Arabic content -->
{{title_ar}}
{{message_ar}}

<!-- Fallback variables (backward compatibility) -->
{{title}}        <!-- Defaults to English -->
{{message}}      <!-- Defaults to English -->
```

#### **User Language Detection:**
```html
<!-- User's preferred language -->
{{userLang}}     <!-- 'en' or 'ar' -->
```

#### **Dynamic Variables:**
```html
<!-- Example: Course announcement -->
{{courseName}}
{{userName}}
{{instructorName}}
{{startDate}}
{{endDate}}

<!-- System variables -->
{{siteName}}     <!-- 'QAF Learning Hub' -->
{{siteUrl}}      <!-- Current site URL -->
```

---

## 🎯 Template Examples

### **Example 1: Announcement Email (Bilingual)**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title_en}} / {{title_ar}}</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Bilingual Header -->
        <h2 style="color: #2563eb; text-align: center;">
            {{#if (eq userLang 'ar')}}
                {{title_ar}}
            {{else}}
                {{title_en}}
            {{/if}}
        </h2>
        
        <!-- Bilingual Message -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            {{#if (eq userLang 'ar')}}
                <p style="direction: rtl; text-align: right; font-size: 16px; line-height: 1.6;">
                    {{message_ar}}
                </p>
            {{else}}
                <p style="direction: ltr; text-align: left; font-size: 16px; line-height: 1.6;">
                    {{message_en}}
                </p>
            {{/if}}
        </div>
        
        <!-- Course Details (if available) -->
        {{#if courseName}}
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">
                {{#if (eq userLang 'ar')}}
                    تفاصيل الدورة
                {{else}}
                    Course Details
                {{/if}}
            </h3>
            <p style="margin: 5px 0;">
                <strong>{{#if (eq userLang 'ar')}}الاسم{{else}}Name{{/if}}:</strong> {{courseName}}
            </p>
            {{#if instructorName}}
            <p style="margin: 5px 0;">
                <strong>{{#if (eq userLang 'ar')}}المدرب{{else}}Instructor{{/if}}:</strong> {{instructorName}}
            </p>
            {{/if}}
        </div>
        {{/if}}
        
        <!-- Action Button -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{siteUrl}}" 
               style="background: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                {{#if (eq userLang 'ar')}}
                    زيارة الموقع
                {{else}}
                    Visit Website
                {{/if}}
            </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
            <p>{{#if (eq userLang 'ar')}}شكرًا لك{{else}}Thank you{{/if}},</p>
            <p>{{siteName}} Team</p>
        </div>
    </div>
</body>
</html>
```

### **Example 2: Simple Bilingual Template**

```html
<div style="font-family: Arial, sans-serif; padding: 20px;">
    <!-- Show both languages -->
    <h2>{{title_en}}</h2>
    <h2 style="direction: rtl;">{{title_ar}}</h2>
    
    <hr>
    
    <p>{{message_en}}</p>
    <p style="direction: rtl; text-align: right;">{{message_ar}}</p>
    
    <hr>
    
    <small>
        Language preference: {{userLang}}
    </small>
</div>
```

### **Example 3: Conditional Language Display**

```html
<!DOCTYPE html>
<html>
<head>
    <title>{{title_en}}</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <!-- Conditional content based on user language -->
        {{#if (eq userLang 'ar')}}
            <!-- Arabic content -->
            <div style="direction: rtl; text-align: right;">
                <h2>{{title_ar}}</h2>
                <p>{{message_ar}}</p>
                <button style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px;">
                    زيارة الموقع
                </button>
            </div>
        {{else}}
            <!-- English content -->
            <div style="direction: ltr; text-align: left;">
                <h2>{{title_en}}</h2>
                <p>{{message_en}}</p>
                <button style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px;">
                    Visit Website
                </button>
            </div>
        {{/if}}
    </div>
</body>
</html>
```

---

## 🔧 Template Engine Features

### **Conditional Logic:**
```handlebars
{{#if (eq userLang 'ar')}}
    Arabic content
{{else}}
    English content
{{/if}}
```

### **Direction Control:**
```html
<!-- For Arabic content -->
<div style="direction: rtl; text-align: right;">
    {{title_ar}}
</div>

<!-- For English content -->
<div style="direction: ltr; text-align: left;">
    {{title_en}}
</div>
```

### **Variable Existence Check:**
```handlebars
{{#if courseName}}
    <p>Course: {{courseName}}</p>
{{/if}}
```

---

## 📝 Usage Examples

### **Sending Announcement:**
```javascript
await notificationGateway.send('announcement_new', {
  userId: 'user123',
  role: 'student',
  email: 'student@example.com',
  lang: 'ar', // User's preferred language
  variables: {
    courseName: 'Python 101',
    instructorName: 'John Doe',
    startDate: '2025-02-10'
  }
});
```

### **Template Variables Received:**
```javascript
{
  // Bilingual content
  title_en: 'New Course Available',
  title_ar: 'دورة جديدة متاحة',
  message_en: 'Python 101 is now open for enrollment',
  message_ar: 'بايثون 101 متاحة الآن للتسجيل',
  
  // User data
  courseName: 'Python 101',
  instructorName: 'John Doe',
  startDate: '2025-02-10',
  
  // System data
  siteName: 'QAF Learning Hub',
  siteUrl: 'https://your-domain.com',
  userLang: 'ar'
}
```

---

## 🎨 Best Practices

### **1. Always Provide Fallbacks:**
```html
<!-- Good: Fallback to English -->
<h2>{{#if title_ar}}{{title_ar}}{{else}}{{title_en}}{{/if}}</h2>

<!-- Good: Use default variables -->
<p>{{message}}</p> <!-- Defaults to English -->
```

### **2. Use RTL/LTR Appropriately:**
```html
{{#if (eq userLang 'ar')}}
<div style="direction: rtl; text-align: right;">
    {{title_ar}}
</div>
{{else}}
<div style="direction: ltr; text-align: left;">
    {{title_en}}
</div>
{{/if}}
```

### **3. Test Both Languages:**
- Always test templates with both `userLang: 'en'` and `userLang: 'ar'`
- Check notification logs to see what variables are being sent
- Use the notification logs modal to debug bilingual content

---

## 🐛 Debugging

### **Check Notification Logs:**
1. Go to Dashboard → Notification Logs
2. Find the email entry
3. Click "View" to see details
4. Check the `variables` section for bilingual content

### **Common Issues:**
- **Missing translations:** Check LangContext for missing keys
- **Template syntax:** Verify Handlebars syntax
- **Variable names:** Ensure variable names match exactly

---

## 📋 Available Triggers

All notification triggers now support bilingual variables:
- `announcement_new` - New announcements
- `activity_new` - New activities
- `activity_graded` - Graded activities
- `resource_new` - New resources
- `quiz_available` - Available quizzes
- `attendance_recorded` - Attendance notifications
- `attendance_absent` - Absence notifications
- `penalty_issued` - Penalty notifications
- `behavior_awarded` - Behavior rewards
- `participation_recorded` - Participation tracking
- `password_reset` - Password resets
- `chat_message` - Chat messages

Each trigger automatically gets bilingual `title` and `message` variables based on the user's language preference and available translations.
