// Default bilingual email templates for CS Learning Hub
// All templates use Qatar timezone (UTC+3) and DD/MM/YYYY format

export const defaultTemplates = [
  {
    id: "announcement_default",
    name: "Announcement Email - Bilingual",
    type: "announcement",
    subject: "📢 New Announcement | إعلان جديد: {{title}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📢 New Announcement | إعلان جديد</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <!-- Greeting -->
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{recipientName}},</p>
    
    <!-- English Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #800020;">
      <h2 style="color: #800020; margin-top: 0; font-size: 22px;">{{title}}</h2>
      <div style="color: #555; line-height: 1.8; font-size: 15px;">{{content}}</div>
      <p style="color: #999; font-size: 13px; margin-top: 15px; margin-bottom: 0;">
        📅 {{dateTime}} (Qatar Time UTC+3)
      </p>
    </div>
    
    <!-- Arabic Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #600018;">
      <h2 style="color: #600018; margin-top: 0; font-size: 22px;">{{title_ar}}</h2>
      <div style="color: #555; line-height: 1.8; font-size: 15px;">{{content_ar}}</div>
      <p style="color: #999; font-size: 13px; margin-top: 15px; margin-bottom: 0;">
        📅 {{dateTime}} (توقيت قطر UTC+3)
      </p>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        View Announcement | عرض الإعلان
      </a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
    <p style="margin: 5px 0 0 0;">This email was sent automatically | تم إرسال هذا البريد تلقائياً</p>
  </div>
</div>
    `,
    variables: [
      "recipientName",
      "title",
      "title_ar",
      "content",
      "content_ar",
      "dateTime",
      "link",
      "siteName",
      "currentDate",
    ],
  },

  {
    id: "activity_default",
    name: "New Activity Email - Bilingual",
    type: "activity",
    subject: "📝 New Activity | نشاط جديد: {{activityTitle}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📝 New Activity | نشاط جديد</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{recipientName}},</p>
    
    <!-- English Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
      <h2 style="color: #4CAF50; margin-top: 0;">{{activityTitle}}</h2>
      <p style="color: #666; margin: 10px 0;"><strong>Type:</strong> {{activityType}} | <strong>Course:</strong> {{course}}</p>
      <div style="color: #555; line-height: 1.8; margin: 15px 0;">{{description}}</div>
      <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="margin: 5px 0; color: #333;"><strong>📅 Due Date:</strong> {{dueDateTime}} (Qatar Time)</p>
        <p style="margin: 5px 0; color: #333;"><strong>🎯 Max Score:</strong> {{maxScore}} points</p>
        <p style="margin: 5px 0; color: #333;"><strong>📊 Difficulty:</strong> {{difficulty}}</p>
      </div>
    </div>
    
    <!-- Arabic Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #45a049;">
      <h2 style="color: #45a049; margin-top: 0;">{{activityTitle_ar}}</h2>
      <p style="color: #666; margin: 10px 0;"><strong>النوع:</strong> {{activityType}} | <strong>المادة:</strong> {{course_ar}}</p>
      <div style="color: #555; line-height: 1.8; margin: 15px 0;">{{description_ar}}</div>
      <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="margin: 5px 0; color: #333;"><strong>📅 تاريخ التسليم:</strong> {{dueDateTime}} (توقيت قطر)</p>
        <p style="margin: 5px 0; color: #333;"><strong>🎯 الدرجة القصوى:</strong> {{maxScore}} نقطة</p>
        <p style="margin: 5px 0; color: #333;"><strong>📊 المستوى:</strong> {{difficulty}}</p>
      </div>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Start Activity | ابدأ النشاط
      </a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: [
      "recipientName",
      "activityTitle",
      "activityTitle_ar",
      "activityType",
      "course",
      "course_ar",
      "description",
      "description_ar",
      "dueDateTime",
      "maxScore",
      "difficulty",
      "link",
      "siteName",
      "currentDate",
    ],
  },

  {
    id: "activity_graded_default",
    name: "Activity Graded Email - Bilingual",
    type: "activity_graded",
    subject: "✅ Activity Graded | تم تقييم النشاط: {{activityTitle}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Activity Graded | تم التقييم</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{studentName}},</p>
    
    <!-- English Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
      <h2 style="color: #28a745; margin-top: 0;">Congratulations!</h2>
      <p style="color: #555; font-size: 15px;">Your submission for <strong>{{activityTitle}}</strong> has been graded.</p>
      <div style="background: #d4edda; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 36px; color: #28a745; font-weight: bold;">{{score}}/{{maxScore}}</p>
        <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">Graded on {{dateTime}} (Qatar Time)</p>
      </div>
      <div style="margin-top: 20px;">
        <h3 style="color: #555; font-size: 16px; margin-bottom: 10px;">Instructor Feedback:</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; color: #666; line-height: 1.6;">
          {{feedback}}
        </div>
      </div>
    </div>
    
    <!-- Arabic Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #20c997;">
      <h2 style="color: #20c997; margin-top: 0;">تهانينا!</h2>
      <p style="color: #555; font-size: 15px;">تم تقييم تسليمك لنشاط <strong>{{activityTitle_ar}}</strong></p>
      <div style="background: #d4edda; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 36px; color: #28a745; font-weight: bold;">{{score}}/{{maxScore}}</p>
        <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">تم التقييم في {{dateTime}} (توقيت قطر)</p>
      </div>
      <div style="margin-top: 20px;">
        <h3 style="color: #555; font-size: 16px; margin-bottom: 10px;">ملاحظات المدرس:</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; color: #666; line-height: 1.6;">
          {{feedback_ar}}
        </div>
      </div>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #28a745, #20c997); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        View Details | عرض التفاصيل
      </a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: [
      "studentName",
      "activityTitle",
      "activityTitle_ar",
      "score",
      "maxScore",
      "dateTime",
      "feedback",
      "feedback_ar",
      "link",
      "siteName",
      "currentDate",
    ],
  },

  {
    id: "enrollment_default",
    name: "Enrollment Welcome Email - Bilingual",
    type: "enrollment",
    subject: "🎓 Welcome to {{className}} | مرحباً بك في {{className}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 40px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 32px;">🎓 Welcome!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">مرحباً بك</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{studentName}},</p>
    
    <!-- English Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #800020;">
      <h2 style="color: #800020; margin-top: 0;">Welcome to {{className}}!</h2>
      <p style="color: #555; line-height: 1.8; font-size: 15px;">
        You have been successfully enrolled in <strong>{{className}}</strong> for the <strong>{{term}}</strong> term.
      </p>
      <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #333;"><strong>📚 Class:</strong> {{className}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>🔢 Code:</strong> {{classCode}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>📅 Term:</strong> {{term}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>👨‍🏫 Instructor:</strong> {{instructorName}}</p>
      </div>
      <p style="color: #555; line-height: 1.8;">
        Get ready to learn, collaborate, and achieve your goals. Access your class materials, activities, and resources through the platform.
      </p>
    </div>
    
    <!-- Arabic Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #600018;">
      <h2 style="color: #600018; margin-top: 0;">مرحباً بك في {{className}}!</h2>
      <p style="color: #555; line-height: 1.8; font-size: 15px;">
        تم تسجيلك بنجاح في <strong>{{className}}</strong> للفصل الدراسي <strong>{{term}}</strong>.
      </p>
      <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #333;"><strong>📚 الصف:</strong> {{className}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>🔢 الرمز:</strong> {{classCode}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>📅 الفصل:</strong> {{term}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>👨‍🏫 المدرس:</strong> {{instructorName}}</p>
      </div>
      <p style="color: #555; line-height: 1.8;">
        استعد للتعلم والتعاون وتحقيق أهدافك. يمكنك الوصول إلى مواد الصف والأنشطة والموارد من خلال المنصة.
      </p>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{siteUrl}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Go to Platform | انتقل إلى المنصة
      </a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
    <p style="margin: 5px 0 0 0;">Good luck! | حظاً موفقاً!</p>
  </div>
</div>
    `,
    variables: [
      "studentName",
      "className",
      "classCode",
      "term",
      "instructorName",
      "siteUrl",
      "siteName",
      "currentDate",
    ],
  },

  {
    id: "resource_default",
    name: "New Resource Email - Bilingual",
    type: "resource",
    subject: "📚 New Resource Available | مورد جديد متاح: {{resourceTitle}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📚 New Resource | مورد جديد</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{recipientName}},</p>
    
    <!-- English Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #FF9800;">
      <h2 style="color: #FF9800; margin-top: 0;">{{resourceTitle}}</h2>
      <p style="color: #666; margin: 10px 0;"><strong>Type:</strong> {{resourceType}}</p>
      <div style="color: #555; line-height: 1.8; margin: 15px 0;">{{description}}</div>
      <p style="color: #999; font-size: 13px; margin-top: 15px;">
        📅 Available from: {{currentDateTime}} (Qatar Time)
      </p>
    </div>
    
    <!-- Arabic Content -->
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #F57C00;">
      <h2 style="color: #F57C00; margin-top: 0;">{{resourceTitle}}</h2>
      <p style="color: #666; margin: 10px 0;"><strong>النوع:</strong> {{resourceType}}</p>
      <div style="color: #555; line-height: 1.8; margin: 15px 0;">{{description}}</div>
      <p style="color: #999; font-size: 13px; margin-top: 15px;">
        📅 متاح من: {{currentDateTime}} (توقيت قطر)
      </p>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #FF9800, #F57C00); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Access Resource | الوصول للمورد
      </a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: [
      "recipientName",
      "resourceTitle",
      "resourceType",
      "description",
      "currentDateTime",
      "link",
      "siteName",
      "currentDate",
    ],
  },

  {
    id: "activity_complete_default",
    name: "Activity Completed Notification - Bilingual",
    type: "activity_complete",
    subject:
      "✅ Student Completed Activity | أكمل الطالب النشاط: {{activityTitle}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Activity Completed</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear Instructor,</p>
    
    <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #2196F3;">
      <h2 style="color: #2196F3; margin-top: 0;">Submission Received</h2>
      <p style="color: #555; line-height: 1.8;">
        <strong>{{studentName}}</strong> ({{studentEmail}}) has marked the following activity as complete:
      </p>
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #333;"><strong>📝 Activity:</strong> {{activityTitle}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>🎓 Student:</strong> {{studentName}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>📧 Email:</strong> {{studentEmail}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>🔢 Military Number:</strong> {{militaryNumber}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>📅 Submitted:</strong> {{dateTime}} (Qatar Time)</p>
      </div>
      <p style="color: #555; line-height: 1.8;">
        Please review the submission and provide feedback.
      </p>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Review Submission
      </a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: [
      "studentName",
      "studentEmail",
      "militaryNumber",
      "activityTitle",
      "dateTime",
      "link",
      "siteName",
      "currentDate",
    ],
  },

  {
    id: "chat_digest_default",
    name: "Chat Digest Email - Bilingual",
    type: "chat_digest",
    subject:
      "💬 You have {{unreadCount}} unread messages | لديك {{unreadCount}} رسائل غير مقروءة",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💬 Unread Messages</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">You have {{unreadCount}} unread messages</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{recipientName}},</p>
    <p style="color: #555; line-height: 1.8; margin-bottom: 20px;">
      Here's a summary of your unread messages from the past few hours:
    </p>
    
    <!-- Message List -->
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      {{{messageSummary}}}
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{chatLink}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Go to Chat | انتقل إلى المحادثة
      </a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: [
      "recipientName",
      "unreadCount",
      "chatLink",
      "siteName",
      "currentDate",
    ],
  },

  {
    id: "password_reset_default",
    name: "Password Reset",
    type: "password_reset",
    subject: "🔑 Reset Your Password | إعادة تعيين كلمة المرور",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Password Reset | إعادة تعيين كلمة المرور</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <!-- English Content -->
    <div style="margin-bottom: 30px;">
      <p style="color: #333; font-size: 16px;">Dear {{recipientName}},</p>
      <p style="color: #555; line-height: 1.8;">We received a request to reset the password for your account (<strong>{{userEmail}}</strong>).</p>
      <p style="color: #555; line-height: 1.8;">Click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{resetLink}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #999; font-size: 13px;">
        <strong>Note:</strong> This link will expire in 1 hour for security reasons.
      </p>
      <p style="color: #999; font-size: 13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    
    <!-- Arabic Content -->
    <div style="direction: rtl; border-top: 2px solid #eee; padding-top: 30px;">
      <p style="color: #333; font-size: 16px;">عزيزي {{recipientName}}،</p>
      <p style="color: #555; line-height: 1.8;">تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك (<strong>{{userEmail}}</strong>).</p>
      <p style="color: #555; line-height: 1.8;">انقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{resetLink}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          إعادة تعيين كلمة المرور
        </a>
      </div>
      
      <p style="color: #999; font-size: 13px;">
        <strong>ملاحظة:</strong> ستنتهي صلاحية هذا الرابط خلال ساعة واحدة لأسباب أمنية.
      </p>
      <p style="color: #999; font-size: 13px;">
        إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد بأمان.
      </p>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: [
      "recipientName",
      "userEmail",
      "resetLink",
      "siteName",
      "currentDate",
    ],
  },

  {
    id: "welcome_signup_default",
    name: "Welcome on Signup",
    type: "welcome_signup",
    subject: "🎉 Welcome to {{siteName}} | مرحباً بك في {{siteName}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome! | مرحباً بك!</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <!-- English Content -->
    <div style="margin-bottom: 30px;">
      <p style="color: #333; font-size: 16px;">Dear {{recipientName}},</p>
      <p style="color: #555; line-height: 1.8; font-size: 15px;">
        Thank you for signing up! We're excited to have you join our learning community.
      </p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #800020;">Your Account Details</h3>
        <p style="margin: 8px 0; color: #555;"><strong>Email:</strong> {{userEmail}}</p>
        <p style="margin: 8px 0; color: #555;"><strong>Display Name:</strong> {{displayName}}</p>
        <p style="margin: 8px 0; color: #555;"><strong>Joined:</strong> {{currentDate}}</p>
      </div>
      
      <h3 style="color: #333;">Get Started</h3>
      <ul style="color: #555; line-height: 1.8;">
        <li>Explore our activities and courses</li>
        <li>Complete your profile</li>
        <li>Join class discussions in chat</li>
        <li>Track your progress</li>
      </ul>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{platformUrl}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Go to Dashboard
        </a>
      </div>
    </div>
    
    <!-- Arabic Content -->
    <div style="direction: rtl; border-top: 2px solid #eee; padding-top: 30px;">
      <p style="color: #333; font-size: 16px;">عزيزي {{recipientName}}،</p>
      <p style="color: #555; line-height: 1.8; font-size: 15px;">
        شكرًا لتسجيلك! نحن متحمسون لانضمامك إلى مجتمع التعلم لدينا.
      </p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #600018;">تفاصيل حسابك</h3>
        <p style="margin: 8px 0; color: #555;"><strong>البريد الإلكتروني:</strong> {{userEmail}}</p>
        <p style="margin: 8px 0; color: #555;"><strong>اسم العرض:</strong> {{displayName}}</p>
        <p style="margin: 8px 0; color: #555;"><strong>تاريخ الانضمام:</strong> {{currentDate}}</p>
      </div>
      
      <h3 style="color: #333;">ابدأ الآن</h3>
      <ul style="color: #555; line-height: 1.8;">
        <li>استكشف أنشطتنا ودوراتنا</li>
        <li>أكمل ملفك الشخصي</li>
        <li>انضم إلى مناقشات الصف في الدردشة</li>
        <li>تتبع تقدمك</li>
      </ul>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{platformUrl}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #800020, #600018); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          انتقل إلى لوحة التحكم
        </a>
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: [
      "recipientName",
      "userEmail",
      "displayName",
      "platformUrl",
      "siteName",
      "currentDate",
    ],
  },
  {
    id: "marksEntered",
    name: "Marks Entered Email - Bilingual",
    type: "marks",
    subject: "📊 Marks Entered | تم إدخال الدرجات: {{subjectName}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📊 Marks Entered | تم إدخال الدرجات</h1>
  </div>
  
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{studentName}},</p>
    
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
      <h2 style="color: #10b981; margin-top: 0; font-size: 22px;">Your marks have been entered</h2>
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>Subject:</strong> {{subjectCode}} - {{subjectName}}</p>
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="text-align: center;">
          <div style="font-size: 48px; font-weight: bold; color: #10b981; margin-bottom: 10px;">{{totalScore}}%</div>
          <div style="font-size: 24px; color: #059669; font-weight: 600;">Grade: {{grade}} ({{points}} points)</div>
        </div>
      </div>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 5px 0; color: #555;"><strong>Mid-Term Exam:</strong> {{midTerm}}%</p>
        <p style="margin: 5px 0; color: #555;"><strong>Final Exam:</strong> {{final}}%</p>
        <p style="margin: 5px 0; color: #555;"><strong>Homework:</strong> {{homework}}%</p>
        <p style="margin: 5px 0; color: #555;"><strong>Labs/Projects:</strong> {{labs}}%</p>
        <p style="margin: 5px 0; color: #555;"><strong>Quizzes:</strong> {{quizzes}}%</p>
        <p style="margin: 5px 0; color: #555;"><strong>Participation:</strong> {{participation}}%</p>
        <p style="margin: 5px 0; color: #555;"><strong>Attendance:</strong> {{attendance}}%</p>
      </div>
      {{#if isRetake}}
      <p style="color: #f59e0b; font-size: 14px; margin-top: 15px; font-weight: 600;">⚠️ This is a retake course</p>
      {{/if}}
    </div>
    
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #059669;">
      <h2 style="color: #059669; margin-top: 0; font-size: 22px;">تم إدخال درجاتك</h2>
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>المادة:</strong> {{subjectCode}} - {{subjectName}}</p>
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="text-align: center;">
          <div style="font-size: 48px; font-weight: bold; color: #10b981; margin-bottom: 10px;">{{totalScore}}%</div>
          <div style="font-size: 24px; color: #059669; font-weight: 600;">التقدير: {{grade}} ({{points}} نقطة)</div>
        </div>
      </div>
    </div>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
    <p style="margin: 5px 0 0 0;">This email was sent automatically | تم إرسال هذا البريد تلقائياً</p>
  </div>
</div>
    `,
    variables: [
      "studentName",
      "subjectCode",
      "subjectName",
      "totalScore",
      "grade",
      "points",
      "midTerm",
      "final",
      "homework",
      "labs",
      "quizzes",
      "participation",
      "attendance",
      "isRetake",
    ],
  },
  {
    id: "marksUpdated",
    name: "Marks Updated Email - Bilingual",
    type: "marks",
    subject: "📊 Marks Updated | تم تحديث الدرجات: {{subjectName}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #800020 0%, #810C29FF 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📊 Marks Updated | تم تحديث الدرجات</h1>
  </div>
  
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{studentName}},</p>
    
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #800020;">
      <h2 style="color: #800020; margin-top: 0; font-size: 22px;">Your marks have been updated</h2>
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>Subject:</strong> {{subjectCode}} - {{subjectName}}</p>
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="text-align: center;">
          <div style="font-size: 48px; font-weight: bold; color: #800020; margin-bottom: 10px;">{{totalScore}}%</div>
          <div style="font-size: 24px; color: #810C29FF; font-weight: 600;">Grade: {{grade}} ({{points}} points)</div>
        </div>
      </div>
    </div>
    
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #810C29FF;">
      <h2 style="color: #810C29FF; margin-top: 0; font-size: 22px;">تم تحديث درجاتك</h2>
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>المادة:</strong> {{subjectCode}} - {{subjectName}}</p>
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="text-align: center;">
          <div style="font-size: 48px; font-weight: bold; color: #800020; margin-bottom: 10px;">{{totalScore}}%</div>
          <div style="font-size: 24px; color: #810C29FF; font-weight: 600;">التقدير: {{grade}} ({{points}} نقطة)</div>
        </div>
      </div>
    </div>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
    <p style="margin: 5px 0 0 0;">This email was sent automatically | تم إرسال هذا البريد تلقائياً</p>
  </div>
</div>
    `,
    variables: [
      "studentName",
      "subjectCode",
      "subjectName",
      "totalScore",
      "grade",
      "points",
    ],
  },
  {
    id: "penaltyRecorded",
    name: "Penalty Recorded Email - Bilingual",
    type: "penalty",
    subject: "⚠️ Academic Penalty Recorded | تم تسجيل عقوبة أكاديمية",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Academic Penalty | عقوبة أكاديمية</h1>
  </div>
  
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{studentName}},</p>
    
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
      <h2 style="color: #ef4444; margin-top: 0; font-size: 22px;">Academic Penalty Recorded</h2>
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>Penalty Type:</strong> {{penaltyType}}</p>
      {{#if subjectName}}
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>Subject:</strong> {{subjectName}}</p>
      {{/if}}
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>Severity:</strong> {{severity}}</p>
      {{#if description}}
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;"><strong>Description:</strong></p>
        <p style="color: #555; margin: 5px 0 0 0; font-size: 14px;">{{description}}</p>
      </div>
      {{/if}}
      {{#if action}}
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;"><strong>Action Taken:</strong></p>
        <p style="color: #555; margin: 5px 0 0 0; font-size: 14px;">{{action}}</p>
      </div>
      {{/if}}
      <p style="color: #999; font-size: 13px; margin-top: 15px; margin-bottom: 0;">📅 Date: {{date}}</p>
    </div>
    
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #dc2626;">
      <h2 style="color: #dc2626; margin-top: 0; font-size: 22px;">تم تسجيل عقوبة أكاديمية</h2>
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>نوع العقوبة:</strong> {{penaltyTypeAr}}</p>
      {{#if subjectName}}
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>المادة:</strong> {{subjectName}}</p>
      {{/if}}
      <p style="color: #555; font-size: 15px; margin-bottom: 10px;"><strong>الشدة:</strong> {{severity}}</p>
    </div>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
    <p style="margin: 5px 0 0 0;">This email was sent automatically | تم إرسال هذا البريد تلقائياً</p>
  </div>
</div>
    `,
    variables: [
      "studentName",
      "penaltyType",
      "penaltyTypeAr",
      "subjectName",
      "description",
      "severity",
      "action",
      "date",
    ],
  },
  {
    id: "qr_code_student",
    name: "Student QR Code Email - Bilingual",
    type: "qr_code",
    subject: "🎓 Your Student QR Code | رمز الطالب الخاص بك",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #800020; margin: 0; font-size: 24px;">🎓 Your Student QR Code | رمز الطالب الخاص بك</h1>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
        <strong>{{studentName}}</strong><br>
        <span style="color: #6b7280;">ID: {{studentId}}</span>
      </p>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
      <img src="{{qrCodeDataURL}}" alt="Student QR Code" style="border: 2px solid #e5e7eb; border-radius: 8px;" />
    </div>
    
    <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">📱 How to use your QR code | كيفية استخدام رمزك:</h3>
      <ol style="color: #374151; font-size: 14px; line-height: 1.6; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Show this QR code to your instructor for attendance tracking | أظهر هذا الرمز لمدرسك لتتبع الحضور</li>
        <li style="margin-bottom: 8px;">Keep it saved on your mobile device for easy access | احفظه على جهازك المحمول للوصول السريع</li>
        <li style="margin-bottom: 8px;">This QR code contains your student ID and profile information | يحتوي هذا الرمز على معرف الطالب ومعلومات ملفك الشخصي</li>
      </ol>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        This is an automated email from {{siteName}}.<br>
        If you did not request this QR code, please contact support.<br><br>
        هذا بريد إلكتروني تلقائي من {{siteName}}.<br>
        إذا لم تطلب هذا الرمز، يرجى التواصل مع الدعم.
      </p>
    </div>
  </div>
</div>
    `,
    variables: [
      "studentName",
      "studentId",
      "qrCodeDataURL",
      "siteName"
    ],
  },
  {
    id: "student_summary_report",
    name: "Student Summary Report - Bilingual",
    type: "student_summary",
    subject: "📊 Student Summary Report | تقرير ملخص للطالب: {{studentName}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f8f9fa;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📊 Student Summary Report | تقرير ملخص للطالب</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">{{studentName}}</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px; background: #ffffff;">
    <!-- Student Info -->
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #1e40af;">
      <h2 style="color: #1e40af; margin-top: 0; font-size: 20px;">Student Information | معلومات الطالب</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
        <p style="margin: 5px 0; color: #374151;"><strong>👤 Name:</strong> {{studentName}}</p>
        <p style="margin: 5px 0; color: #374151;"><strong>📧 Email:</strong> {{studentEmail}}</p>
        <p style="margin: 5px 0; color: #374151;"><strong>🆔 ID:</strong> {{studentId}}</p>
        <p style="margin: 5px 0; color: #374151;"><strong>📚 Class:</strong> {{className}}</p>
      </div>
    </div>

    <!-- Attendance Summary -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
      <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">📅 Attendance Summary | ملخص الحضور</h2>
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">{{attendanceStats.present}}</div>
            <div style="font-size: 14px; color: #059669;">Present | حاضر</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">{{attendanceStats.late}}</div>
            <div style="font-size: 14px; color: #d97706;">Late | متأخر</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">{{attendanceStats.absent}}</div>
            <div style="font-size: 14px; color: #dc2626;">Absent | غائب</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #6b7280;">{{attendanceStats.percentage}}%</div>
            <div style="font-size: 14px; color: #4b5563;">Rate | نسبة</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Participation Summary -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
      <h2 style="color: #3b82f6; margin-top: 0; font-size: 20px;">🎯 Participation Summary | ملخص المشاركة</h2>
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">{{participationStats.total}}</div>
            <div style="font-size: 14px; color: #1d4ed8;">Total Points | النقاط الإجمالية</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">{{participationStats.positive}}</div>
            <div style="font-size: 14px; color: #059669;">Positive | إيجابي</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">{{participationStats.neutral}}</div>
            <div style="font-size: 14px; color: #d97706;">Neutral | محايد</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Behavior Summary -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #8b5cf6;">
      <h2 style="color: #8b5cf6; margin-top: 0; font-size: 20px;">⭐ Behavior Summary | ملخص السلوك</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">{{behaviorStats.total}}</div>
            <div style="font-size: 14px; color: #7c3aed;">Total Points | النقاط الإجمالية</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">{{behaviorStats.positive}}</div>
            <div style="font-size: 14px; color: #059669;">Positive | إيجابي</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">{{behaviorStats.negative}}</div>
            <div style="font-size: 14px; color: #dc2626;">Negative | سلبي</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Penalties Summary -->
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
      <h2 style="color: #ef4444; margin-top: 0; font-size: 20px;">⚠️ Penalties Summary | ملخص العقوبات</h2>
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">{{penaltyStats.total}}</div>
            <div style="font-size: 14px; color: #dc2626;">Total Penalties | إجمالي العقوبات</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">{{penaltyStats.minor}}</div>
            <div style="font-size: 14px; color: #d97706;">Minor | طفيفة</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">{{penaltyStats.major}}</div>
            <div style="font-size: 14px; color: #dc2626;">Major | رئيسية</div>
          </div>
        </div>
        {{#if penaltyStats.recentPenalties}}
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #fecaca;">
          <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">Recent Penalties | العقوبات الأخيرة:</h4>
          <div style="color: #7f1d1d; font-size: 14px; line-height: 1.6;">
            {{penaltyStats.recentPenalties}}
          </div>
        </div>
        {{/if}}
      </div>
    </div>

    <!-- Overall Performance -->
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 8px; margin-top: 25px; text-align: center;">
      <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">🏆 Overall Performance | الأداء العام</h3>
      <div style="font-size: 32px; font-weight: bold; color: #1e40af; margin: 15px 0;">{{overallGrade}}</div>
      <p style="color: #64748b; font-size: 14px; margin: 0;">Performance Rating | تقييم الأداء</p>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f8f9fa;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}} ({{reportPeriod}})</p>
    <p style="margin: 5px 0 0 0;">This report was generated automatically | تم إنشاء هذا التقرير تلقائياً</p>
  </div>
</div>
    `,
    variables: [
      "studentName",
      "studentEmail", 
      "studentId",
      "className",
      "attendanceStats",
      "participationStats",
      "behaviorStats", 
      "penaltyStats",
      "overallGrade",
      "reportPeriod",
      "siteName",
      "currentDate"
    ],
  },
];
