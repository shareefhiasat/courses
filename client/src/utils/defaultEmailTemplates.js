/**
 * Default Email Templates
 * These templates are used as fallbacks and can be uploaded to Firestore
 */

export const defaultEmailTemplates = [
  // Activity Templates
  {
    id: "activity_default",
    name: "Activity Assignment Email - Bilingual",
    type: "activity",
    subject: "📚 New Activity Assigned | تم تكليف نشاط جديد: {{title}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📚 New Activity Assigned | تم تكليف نشاط جديد</h1>
  </div>
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{recipientName}},</p>
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
      <p style="color: #555; font-size: 15px;">A new activity has been assigned to you in <strong>{{className}}</strong>.</p>
      <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="margin: 5px 0; color: #333;"><strong>📝 Activity:</strong> {{title}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>📅 Due Date:</strong> {{dueDate}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>🔗 Points:</strong> {{points}}</p>
      </div>
    </div>
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #2563eb;">
      <p style="color: #555; font-size: 15px;">تم تكليفك بنشاط جديد في <strong>{{className_ar}}</strong>.</p>
      <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="margin: 5px 0; color: #333;"><strong>📝 النشاط:</strong> {{title_ar}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>📅 تاريخ الاستحقاق:</strong> {{dueDate_ar}}</p>
        <p style="margin: 5px 0; color: #333;"><strong>🔗 النقاط:</strong> {{points}}</p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        View Activity | عرض النشاط
      </a>
    </div>
  </div>
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: ["recipientName", "className", "className_ar", "title", "title_ar", "dueDate", "dueDate_ar", "points", "link", "siteName", "currentDate"],
  },

  // Announcement Templates
  {
    id: "announcement_default",
    name: "Announcement Email - Bilingual",
    type: "announcement",
    subject: "📢 New Announcement | إعلان جديد: {{title}}",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📢 New Announcement | إعلان جديد</h1>
  </div>
  <div style="padding: 30px; background: #ffffff;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{recipientName}},</p>
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #8b5cf6;">
      <h3 style="color: #333; margin: 0 0 10px 0;">{{title}}</h3>
      <div style="background: #f3e8ff; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="margin: 0; color: #555; font-size: 14px;">{{message}}</p>
      </div>
    </div>
    <div style="background: white; padding: 25px; border-radius: 8px; direction: rtl; border-right: 4px solid #7c3aed;">
      <h3 style="color: #333; margin: 0 0 10px 0;">{{title_ar}}</h3>
      <div style="background: #f3e8ff; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="margin: 0; color: #555; font-size: 14px;">{{message_ar}}</p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        View Announcement | عرض الإعلان
      </a>
    </div>
  </div>
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5;">
    <p style="margin: 0;">{{siteName}} - {{currentDate}}</p>
  </div>
</div>
    `,
    variables: ["recipientName", "title", "title_ar", "message", "message_ar", "link", "siteName", "currentDate"],
  },

  // QR Code Template - Add this back for Firestore upload
  {
    id: "qr_code_student",
    name: "Student QR Code Email - Bilingual",
    type: "qr_code",
    subject: "🎓 Your Student QR Code | رمز الطالب الخاص بك",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Your Student QR Code | رمز الطالب الخاص بك</h1>
  </div>
  
  <div style="padding: 30px; background: #ffffff;">
    <!-- Student Info -->
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
      <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px;">{{studentName}}</h2>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Student ID: {{studentId}}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">{{studentEmail}}</p>
    </div>
    
    <!-- QR Code Section -->
    <div style="text-align: center; margin: 25px 0;">
      <div style="display: inline-block; padding: 20px; background: white; border: 2px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <a href="{{qrCodeImage}}" style="display: block; text-decoration: none;">
          <div style="background: #f9fafb; padding: 40px; border-radius: 8px; margin-bottom: 15px;">
            <div style="font-size: 48px; color: #059669;">📱</div>
            <div style="color: #6b7280; font-size: 14px; margin-top: 10px;">Click to View QR Code</div>
          </div>
        </a>
        <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">Click the button above to access your QR code</p>
      </div>
    </div>
    
    <!-- Instructions English -->
    <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">📱 How to access your QR code:</h3>
      <ol style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0;">
        <li style="margin-bottom: 10px;">Click the button above to view your QR code instantly</li>
        <li style="margin-bottom: 10px;">No login required - works immediately</li>
        <li style="margin-bottom: 10px;">Bookmark the page for easy access</li>
        <li style="margin-bottom: 10px;">Show QR code to instructor for attendance</li>
        <li style="margin-bottom: 0;">Print if needed for offline use</li>
      </ol>
    </div>
    
    <!-- Instructions Arabic -->
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; direction: rtl; margin-bottom: 25px;">
      <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 18px;">📱 كيفية الوصول إلى رمز الاستجابة السريعة:</h3>
      <ol style="color: #374151; font-size: 15px; line-height: 1.8; padding-right: 20px; margin: 0;">
        <li style="margin-bottom: 10px;">انقر على الزر أعلاه لعرض رمز الاستجابة السريعة فوراً</li>
        <li style="margin-bottom: 10px;">لا يتطلب تسجيل الدخول - يعمل فوراً</li>
        <li style="margin-bottom: 10px;">احفظ الصفحة للوصول السريع</li>
        <li style="margin-bottom: 10px;">أظهر الرمز للمدرب لتتبع الحضور</li>
        <li style="margin-bottom: 0;">اطبع إذا لزم الأمر للاستخدام دون اتصال</li>
      </ol>
    </div>
    
    <!-- Important Note -->
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
      <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
        <strong>⚠️ Important:</strong> Keep your QR code link secure. Do not share it with others.
      </p>
      <p style="color: #92400e; margin: 10px 0 0 0; font-size: 14px; text-align: center; direction: rtl;">
        <strong>⚠️ هام:</strong> احتفظ برابط رمز الاستجابة السريعة بشكل آمن. لا تشاركه مع الآخرين.
      </p>
    </div>
    
    <!-- Contact Info -->
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
        If you have any questions, please contact:<br>
        📧 support@cslh.qa | 📞 +974 XXXX XXXX
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0; direction: rtl;">
        إذا كان لديك أي أسئلة، يرجى التواصل مع:<br>
        📧 support@cslh.qa | 📞 +974 XXXX XXXX
      </p>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 5px 0;">This is an automated email from {{siteName}}.</p>
    <p style="margin: 0 0 5px 0;">If you did not request this QR code, please contact support immediately.</p>
    <p style="margin: 5px 0 0 0; direction: rtl;">هذا بريد إلكتروني تلقائي من {{siteName}}.</p>
    <p style="margin: 5px 0 0 0; direction: rtl;">إذا لم تطلب هذا الرمز، يرجى التواصل مع الدعم الفوري.</p>
    <p style="margin: 15px 0 0 0; font-weight: bold;">{{currentDate}} (Qatar Time UTC+3)</p>
  </div>
</div>
    `,
    variables: ["studentName", "studentId", "studentEmail", "qrCodeImage", "siteName", "currentDate"],
  },
];

// Add alias for backward compatibility
export const defaultTemplates = defaultEmailTemplates;

export default defaultEmailTemplates;
