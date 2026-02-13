# 📧 Email Template Variables - Copy & Paste Helper

## 🌍 Universal Variables (Available in ALL Templates)

### **Bilingual Content Variables:**
```html
{{titleEn}}        <!-- English title -->
{{titleAr}}        <!-- Arabic title -->
{{messageEn}}      <!-- English message -->
{{messageAr}}      <!-- Arabic message -->
{{title}}           <!-- Fallback: English title -->
{{message}}         <!-- Fallback: English message -->
{{userLang}}        <!-- User's preferred language: 'en' or 'ar' -->
```

### **System Variables:**
```html
{{siteName}}        <!-- 'QAF Learning Hub' -->
{{siteUrl}}         <!-- Current website URL -->
{{recipientEmail}}  <!-- Recipient's email address -->
{{createdAt}}       <!-- Qatar timezone creation time -->
{{updatedAt}}       <!-- Qatar timezone update time -->
```

---

## 🎯 Notification Type Specific Variables

### **1. Announcement (announcement_new)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "New Announcement" -->
{{titleAr}}        <!-- Arabic: "إعلان جديد" -->
{{messageEn}}      <!-- English announcement message -->
{{messageAr}}      <!-- Arabic announcement message -->

<!-- Additional variables -->
{{announcementTitle}}     <!-- Custom announcement title -->
{{announcementContent}}    <!-- Custom announcement content -->
{{programName}}            <!-- Program name (if program-specific) -->
{{subjectName}}            <!-- Subject name (if subject-specific) -->
{{className}}              <!-- Class name (if class-specific) -->
{{classDescription}}       <!-- Class description -->
{{instructorName}}         <!-- If sent by instructor -->
{{postedBy}}               <!-- Name of who posted -->
{{priority}}               <!-- Priority level: high/medium/low -->
{{createdAt}}              <!-- Qatar timezone when posted -->
```

**Template Example:**
```html
<h2>{{titleEn}} / {{titleAr}}</h2>
<div>
    <p>{{messageEn}}</p>
    <p style="direction: rtl;">{{messageAr}}</p>
</div>
{{#if programName}}
<p><strong>Program:</strong> {{programName}}</p>
{{/if}}
{{#if subjectName}}
<p><strong>Subject:</strong> {{subjectName}}</p>
{{/if}}
{{#if className}}
<p><strong>Class:</strong> {{className}}</p>
{{/if}}
```

---

### **2. Activity (activity_new)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "New Activity" -->
{{titleAr}}        <!-- Arabic: "نشاط جديد" -->
{{messageEn}}      <!-- English activity message -->
{{messageAr}}      <!-- Arabic activity message -->

<!-- Activity-specific variables -->
{{activityName}}         <!-- Activity title -->
{{activityType}}         <!-- Type: assignment/quiz/project -->
{{activityDescription}}   <!-- Activity description -->
{{dueDate}}             <!-- Qatar timezone due date -->
{{startDate}}            <!-- Qatar timezone start date -->
{{endDate}}              <!-- Qatar timezone end date -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{classDescription}}     <!-- Class description -->
{{instructorName}}        <!-- Instructor name -->
{{points}}               <!-- Possible points -->
{{estimatedTime}}        <!-- Estimated completion time -->
{{createdAt}}            <!-- Qatar timezone when created -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #f0f9ff; padding: 15px; margin: 10px 0;">
    <h3>{{activityName}}</h3>
    <p><strong>Type:</strong> {{activityType}}</p>
    <p><strong>Due:</strong> {{dueDate}}</p>
    <p><strong>Points:</strong> {{points}}</p>
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
</div>
```

---

### **3. Graded Activity (activity_graded)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "Activity Graded" -->
{{titleAr}}        <!-- Arabic: "تم تقييم النشاط" -->
{{messageEn}}      <!-- English grading message -->
{{messageAr}}      <!-- Arabic grading message -->

<!-- Grading-specific variables -->
{{activityName}}         <!-- Activity title -->
{{activityDescription}}   <!-- Activity description -->
{{grade}}               <!-- Grade received -->
{{score}}               <!-- Numeric score -->
{{maxScore}}            <!-- Maximum possible score -->
{{percentage}}          <!-- Grade percentage -->
{{feedback}}            <!-- Instructor feedback -->
{{gradedBy}}            <!-- Who graded it -->
{{gradedAt}}            <!-- Qatar timezone when graded -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{passingStatus}}        <!-- Pass/Fail status -->
{{studentName}}          <!-- Student full name -->
{{studentDisplayName}}   <!-- Student display name -->
{{studentNumber}}        <!-- Student number (for scanning) -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #f0fdf4; padding: 15px; margin: 10px 0;">
    <h3>{{activityName}}</h3>
    <p><strong>Student:</strong> {{studentName}} ({{studentNumber}})</p>
    <p><strong>Score:</strong> {{score}}/{{maxScore}} ({{percentage}}%)</p>
    <p><strong>Status:</strong> {{passingStatus}}</p>
    {{#if feedback}}
    <p><strong>Feedback:</strong> {{feedback}}</p>
    {{/if}}
    <p><strong>Graded at:</strong> {{gradedAt}}</p>
</div>
```

---

### **4. Resource (resource_new)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "New Resource" -->
{{titleAr}}        <!-- Arabic: "مورد جديد" -->
{{messageEn}}      <!-- English resource message -->
{{messageAr}}      <!-- Arabic resource message -->

<!-- Resource-specific variables -->
{{resourceName}}         <!-- Resource title -->
{{resourceType}}         <!-- Type: document/video/link/etc -->
{{resourceDescription}}  <!-- Resource description -->
{{resourceUrl}}          <!-- Resource URL -->
{{fileSize}}            <!-- File size (if applicable) -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{classDescription}}     <!-- Class description -->
{{uploadedBy}}           <!-- Who uploaded it -->
{{category}}             <!-- Resource category -->
{{tags}}                <!-- Resource tags -->
{{createdAt}}            <!-- Qatar timezone when uploaded -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #fef3c7; padding: 15px; margin: 10px 0;">
    <h3>{{resourceName}}</h3>
    <p><strong>Type:</strong> {{resourceType}}</p>
    <p><strong>Category:</strong> {{category}}</p>
    {{#if fileSize}}
    <p><strong>Size:</strong> {{fileSize}}</p>
    {{/if}}
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
    <a href="{{resourceUrl}}" style="background: #2563eb; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
        Access Resource
    </a>
</div>
```

---

### **5. Quiz Available (quiz_available)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "Quiz Available" -->
{{titleAr}}        <!-- Arabic: "اختبار متاح" -->
{{messageEn}}      <!-- English quiz message -->
{{messageAr}}      <!-- Arabic quiz message -->

<!-- Quiz-specific variables -->
{{quizName}}             <!-- Quiz title -->
{{quizDescription}}      <!-- Quiz description -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{classDescription}}     <!-- Class description -->
{{startDate}}            <!-- Qatar timezone when quiz opens -->
{{endDate}}              <!-- Qatar timezone when quiz closes -->
{{duration}}             <!-- Quiz duration -->
{{attempts}}             <!-- Number of attempts -->
{{questionCount}}        <!-- Number of questions -->
{{passingScore}}         <!-- Passing score -->
{{instructorName}}        <!-- Instructor name -->
{{createdAt}}            <!-- Qatar timezone when created -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #f3e8ff; padding: 15px; margin: 10px 0;">
    <h3>{{quizName}}</h3>
    <p><strong>Duration:</strong> {{duration}}</p>
    <p><strong>Questions:</strong> {{questionCount}}</p>
    <p><strong>Attempts:</strong> {{attempts}}</p>
    <p><strong>Available:</strong> {{startDate}} - {{endDate}}</p>
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
    <a href="{{siteUrl}}" style="background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
        Start Quiz
    </a>
</div>
```

---

### **6. Attendance Recorded (attendance_recorded)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "Attendance Recorded" -->
{{titleAr}}        <!-- Arabic: "تم تسجيل الحضور" -->
{{messageEn}}      <!-- English attendance message -->
{{messageAr}}      <!-- Arabic attendance message -->

<!-- Attendance-specific variables -->
{{studentName}}          <!-- Student full name -->
{{studentDisplayName}}   <!-- Student display name -->
{{studentNumber}}        <!-- Student number (for scanning) -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{classDescription}}     <!-- Class description -->
{{attendanceDate}}       <!-- Qatar timezone date of attendance -->
{{attendanceTime}}       <!-- Qatar timezone time of attendance -->
{{attendanceStatus}}     <!-- Status: present/late/absent -->
{{markedBy}}             <!-- Who marked attendance -->
{{method}}               <!-- Method: manual/qr/scanner -->
{{notes}}                <!-- Additional notes -->
{{recordedAt}}           <!-- Qatar timezone when recorded -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #ecfdf5; padding: 15px; margin: 10px 0;">
    <p><strong>Student:</strong> {{studentName}} ({{studentNumber}})</p>
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
    <p><strong>Date:</strong> {{attendanceDate}}</p>
    <p><strong>Time:</strong> {{attendanceTime}}</p>
    <p><strong>Status:</strong> {{attendanceStatus}}</p>
    <p><strong>Method:</strong> {{method}}</p>
    {{#if notes}}
    <p><strong>Notes:</strong> {{notes}}</p>
    {{/if}}
</div>
```

---

### **7. Attendance Absent (attendance_absent)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "Attendance Marked Absent" -->
{{titleAr}}        <!-- Arabic: "تم تسجيل الغياب" -->
{{messageEn}}      <!-- English absence message -->
{{messageAr}}      <!-- Arabic absence message -->

<!-- Absence-specific variables -->
{{studentName}}          <!-- Student full name -->
{{studentDisplayName}}   <!-- Student display name -->
{{studentNumber}}        <!-- Student number (for scanning) -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{classDescription}}     <!-- Class description -->
{{absenceDate}}          <!-- Qatar timezone date of absence -->
{{absenceReason}}        <!-- Reason for absence -->
{{markedBy}}             <!-- Who marked it -->
{{notes}}                <!-- Additional notes -->
{{recordedAt}}           <!-- Qatar timezone when recorded -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #fef2f2; padding: 15px; margin: 10px 0;">
    <p><strong>Student:</strong> {{studentName}} ({{studentNumber}})</p>
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
    <p><strong>Date:</strong> {{absenceDate}}</p>
    <p><strong>Reason:</strong> {{absenceReason}}</p>
    {{#if notes}}
    <p><strong>Notes:</strong> {{notes}}</p>
    {{/if}}
</div>
```

---

### **8. Penalty Issued (penalty_issued)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "Penalty Issued" -->
{{titleAr}}        <!-- Arabic: "تم إصدار عقوبة" -->
{{messageEn}}      <!-- English penalty message -->
{{messageAr}}      <!-- Arabic penalty message -->

<!-- Penalty-specific variables -->
{{studentName}}          <!-- Student full name -->
{{studentDisplayName}}   <!-- Student display name -->
{{studentNumber}}        <!-- Student number (for scanning) -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{classDescription}}     <!-- Class description -->
{{penaltyType}}          <!-- Type of penalty -->
{{penaltyReason}}        <!-- Reason for penalty -->
{{penaltyPoints}}        <!-- Points deducted -->
{{currentPoints}}        <!-- Current total points -->
{{issuedBy}}            <!-- Who issued penalty -->
{{issuedAt}}            <!-- Qatar timezone when issued -->
{{notes}}                <!-- Additional notes -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #fef2f2; padding: 15px; margin: 10px 0;">
    <p><strong>Student:</strong> {{studentName}} ({{studentNumber}})</p>
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
    <p><strong>Type:</strong> {{penaltyType}}</p>
    <p><strong>Reason:</strong> {{penaltyReason}}</p>
    <p><strong>Points:</strong> -{{penaltyPoints}}</p>
    <p><strong>Total Points:</strong> {{currentPoints}}</p>
    <p><strong>Issued by:</strong> {{issuedBy}}</p>
    <p><strong>Issued at:</strong> {{issuedAt}}</p>
    {{#if notes}}
    <p><strong>Notes:</strong> {{notes}}</p>
    {{/if}}
</div>
```

---

### **9. Behavior Awarded (behavior_awarded)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "Behavior Awarded" -->
{{titleAr}}        <!-- Arabic: "تم منح سلوك" -->
{{messageEn}}      <!-- English behavior message -->
{{messageAr}}      <!-- Arabic behavior message -->

<!-- Behavior-specific variables -->
{{studentName}}          <!-- Student full name -->
{{studentDisplayName}}   <!-- Student display name -->
{{studentNumber}}        <!-- Student number (for scanning) -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{classDescription}}     <!-- Class description -->
{{behaviorType}}         <!-- Type of behavior -->
{{behaviorDescription}}  <!-- Description of behavior -->
{{pointsAwarded}}        <!-- Points awarded -->
{{currentPoints}}        <!-- Current total points -->
{{awardedBy}}           <!-- Who awarded it -->
{{awardedAt}}            <!-- Qatar timezone when awarded -->
{{category}}             <!-- Behavior category -->
{{notes}}                <!-- Additional notes -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #f0fdf4; padding: 15px; margin: 10px 0;">
    <p><strong>Student:</strong> {{studentName}} ({{studentNumber}})</p>
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
    <p><strong>Behavior:</strong> {{behaviorType}}</p>
    <p><strong>Description:</strong> {{behaviorDescription}}</p>
    <p><strong>Points:</strong> +{{pointsAwarded}}</p>
    <p><strong>Total Points:</strong> {{currentPoints}}</p>
    <p><strong>Awarded by:</strong> {{awardedBy}}</p>
    <p><strong>Awarded at:</strong> {{awardedAt}}</p>
    {{#if notes}}
    <p><strong>Notes:</strong> {{notes}}</p>
    {{/if}}
</div>
```

---

### **10. Participation Recorded (participation_recorded)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "Participation Recorded" -->
{{titleAr}}        <!-- Arabic: "تم تسجيل المشاركة" -->
{{messageEn}}      <!-- English participation message -->
{{messageAr}}      <!-- Arabic participation message -->

<!-- Participation-specific variables -->
{{studentName}}          <!-- Student full name -->
{{studentDisplayName}}   <!-- Student display name -->
{{studentNumber}}        <!-- Student number (for scanning) -->
{{programName}}          <!-- Program name -->
{{subjectName}}          <!-- Subject name -->
{{className}}            <!-- Class name -->
{{classDescription}}     <!-- Class description -->
{{participationType}}     <!-- Type of participation -->
{{participationDetails}}  <!-- Details of participation -->
{{pointsAwarded}}        <!-- Points awarded -->
{{currentPoints}}        <!-- Current total points -->
{{recordedBy}}           <!-- Who recorded it -->
{{recordedAt}}            <!-- Qatar timezone when recorded -->
{{activityName}}         <!-- Related activity -->
{{notes}}                <!-- Additional notes -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #eff6ff; padding: 15px; margin: 10px 0;">
    <p><strong>Student:</strong> {{studentName}} ({{studentNumber}})</p>
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
    <p><strong>Type:</strong> {{participationType}}</p>
    <p><strong>Details:</strong> {{participationDetails}}</p>
    <p><strong>Points:</strong> +{{pointsAwarded}}</p>
    <p><strong>Total Points:</strong> {{currentPoints}}</p>
    <p><strong>Activity:</strong> {{activityName}}</p>
    <p><strong>Recorded at:</strong> {{recordedAt}}</p>
    {{#if notes}}
    <p><strong>Notes:</strong> {{notes}}</p>
    {{/if}}
</div>
```

---

### **11. Password Reset (password_reset)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "Password Reset" -->
{{titleAr}}        <!-- Arabic: "إعادة تعيين كلمة المرور" -->
{{messageEn}}      <!-- English reset message -->
{{messageAr}}      <!-- Arabic reset message -->

<!-- Password-specific variables -->
{{userName}}            <!-- User's name -->
{{resetToken}}          <!-- Password reset token -->
{{resetLink}}          <!-- Password reset link -->
{{expiryTime}}          <!-- Link expiry time -->
{{requestedAt}}         <!-- Qatar timezone when reset was requested -->
{{requesterIp}}        <!-- IP address of requester -->
{{deviceInfo}}         <!-- Device information -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #fef3c7; padding: 15px; margin: 10px 0;">
    <p><strong>Hello {{userName}},</strong></p>
    <p>You requested a password reset for your account.</p>
    <p><strong>Reset Link:</strong> <a href="{{resetLink}}">Reset Password</a></p>
    <p><strong>Expires:</strong> {{expiryTime}}</p>
    <p><strong>Requested:</strong> {{requestedAt}}</p>
    <p><small>If you didn't request this, please contact support.</small></p>
</div>
```

---

### **12. Chat Message (chat_message)**
```html
<!-- Core content -->
{{titleEn}}        <!-- English: "New Message" -->
{{titleAr}}        <!-- Arabic: "رسالة جديدة" -->
{{messageEn}}      <!-- English chat message -->
{{messageAr}}      <!-- Arabic chat message -->

<!-- Chat-specific variables -->
{{senderName}}          <!-- Name of sender -->
{{senderRole}}          <!-- Role of sender -->
{{chatRoomName}}        <!-- Chat room name -->
{{messageContent}}      <!-- Message content -->
{{messageTime}}         <!-- Qatar timezone when message was sent -->
{{programName}}          <!-- Related program -->
{{subjectName}}          <!-- Related subject -->
{{className}}            <!-- Related class -->
{{classDescription}}     <!-- Class description -->
{{messageType}}         <!-- Type: text/file/image -->
{{attachmentUrl}}        <!-- If file attachment -->
{{createdAt}}            <!-- Qatar timezone when created -->
```

**Template Example:**
```html
<h2>{{titleEn}}</h2>
<p>{{messageEn}}</p>
<div style="background: #f8fafc; padding: 15px; margin: 10px 0;">
    <p><strong>From:</strong> {{senderName}} ({{senderRole}})</p>
    <p><strong>Room:</strong> {{chatRoomName}}</p>
    {{#if programName}}
    <p><strong>Program:</strong> {{programName}}</p>
    {{/if}}
    {{#if subjectName}}
    <p><strong>Subject:</strong> {{subjectName}}</p>
    {{/if}}
    {{#if className}}
    <p><strong>Class:</strong> {{className}}</p>
    {{/if}}
    <p><strong>Time:</strong> {{messageTime}}</p>
    <div style="background: white; padding: 10px; border-radius: 4px; margin: 10px 0;">
        {{messageContent}}
    </div>
    {{#if attachmentUrl}}
    <a href="{{attachmentUrl}}" style="color: #2563eb;">Download Attachment</a>
    {{/if}}
</div>
```

---

## 🎨 Universal Template Structure

### **Complete Bilingual Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{titleEn}} / {{titleAr}}</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">
                {{titleEn}}
                <br>
                <span style="direction: rtl;">{{titleAr}}</span>
            </h1>
        </div>
        
        <!-- Main Content -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <!-- English Content -->
            <div style="direction: ltr; text-align: left;">
                <p>{{messageEn}}</p>
            </div>
            
            <hr style="margin: 20px 0;">
            
            <!-- Arabic Content -->
            <div style="direction: rtl; text-align: right;">
                <p>{{messageAr}}</p>
            </div>
        </div>
        
        <!-- Dynamic Content (based on notification type) -->
        <!-- Add type-specific variables here -->
        
        <!-- Program/Subject/Class Information -->
        {{#if programName}}
        <p><strong>Program:</strong> {{programName}}</p>
        {{/if}}
        {{#if subjectName}}
        <p><strong>Subject:</strong> {{subjectName}}</p>
        {{/if}}
        {{#if className}}
        <p><strong>Class:</strong> {{className}}</p>
        {{/if}}
        
        <!-- Student Information (when applicable) -->
        {{#if studentName}}
        <p><strong>Student:</strong> {{studentName}} ({{studentNumber}})</p>
        {{/if}}
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #6b7280;">
            <p>{{siteName}}</p>
            <small>Language preference: {{userLang}}</small>
            <br>
            <small>Created: {{createdAt}}</small>
        </div>
    </div>
</body>
</html>
```

---

## 🚀 Quick Copy & Paste

### **Basic Bilingual Structure:**
```html
<h2>{{titleEn}}</h2>
<h2 style="direction: rtl;">{{titleAr}}</h2>

<p>{{messageEn}}</p>
<p style="direction: rtl; text-align: right;">{{messageAr}}</p>

<hr>

{{#if programName}}
<p><strong>Program:</strong> {{programName}}</p>
{{/if}}
{{#if subjectName}}
<p><strong>Subject:</strong> {{subjectName}}</p>
{{/if}}
{{#if className}}
<p><strong>Class:</strong> {{className}}</p>
{{/if}}

<p><strong>Site:</strong> {{siteName}}</p>
<p><strong>Language:</strong> {{userLang}}</p>
<p><strong>Created:</strong> {{createdAt}}</p>
```

### **Conditional Display:**
```html
{{#if (eq userLang 'ar')}}
<div style="direction: rtl; text-align: right;">
    <h2>{{titleAr}}</h2>
    <p>{{messageAr}}</p>
</div>
{{else}}
<div style="direction: ltr; text-align: left;">
    <h2>{{titleEn}}</h2>
    <p>{{messageEn}}</p>
</div>
{{/if}}
```

---

## 📋 Variable Naming Convention

### **✅ All Variables Now Use camelCase:**
- `{{titleEn}}` / `{{titleAr}}` (not `title_en`/`title_ar`)
- `{{messageEn}}` / `{{messageAr}}` (not `message_en`/`message_ar`)
- `{{programName}}` (not `courseName`)
- `{{subjectName}}` (new field)
- `{{className}}` + `{{classDescription}}`
- `{{studentName}}` + `{{studentDisplayName}}` + `{{studentNumber}}`
- `{{createdAt}}` / `{{updatedAt}}` (Qatar timezone)
- `{{attendanceDate}}` / `{{attendanceTime}}` (Qatar timezone)
- `{{startDate}}` / `{{endDate}}` (Qatar timezone)
- `{{issuedAt}}` / `{{awardedAt}}` / `{{recordedAt}}` (Qatar timezone)

### **❌ Removed Non-Existent Fields:**
- `makeupAllowed`, `makeupDeadline`, `contactRequired`
- `appealAllowed`, `appealDeadline`
- `securityNote`
- `courseName` (replaced with `programName`/`subjectName`/`className`)

---

## 📋 Testing Checklist

For each template, test with:
- ✅ English user (userLang: 'en')
- ✅ Arabic user (userLang: 'ar')
- ✅ All available variables
- ✅ Missing variables (should not break)
- ✅ Special characters in content
- ✅ Long content
- ✅ HTML rendering
- ✅ Qatar timezone formatting

**Use Dashboard → Notification Logs → "View" to debug variables!**
