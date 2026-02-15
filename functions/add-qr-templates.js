const admin = require('./node_modules/firebase-admin');
const { Timestamp } = require('./node_modules/firebase-admin/firestore');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'main-one-32026'
});

const db = admin.firestore();

const createQRTemplates = async () => {
  const qrTemplates = [
    {
      id: "qr_code_student",
      name: "Student QR Code Email - Bilingual",
      type: "qr_code",
      subject: "🎓 Your Student QR Code | رمز الطالب الخاص بك",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
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
</div>`,
      variables: ["studentName", "studentId", "qrCodeDataURL", "siteName"],
      enabled: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      id: "student_qr_code",
      name: "Student QR Code Email - Enhanced",
      type: "qr_code",
      subject: "🎓 Your Student QR Code | رمز الطالب الخاص بك",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Your Student QR Code | رمز الطالب الخاص بك</h1>
  </div>
  
  <div style="padding: 30px; background: #ffffff;">
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
      <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px;">{{studentName}}</h2>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Student ID: {{studentId}}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">{{studentEmail}}</p>
    </div>
    
    <div style="text-align: center; margin: 25px 0;">
      <div style="display: inline-block; padding: 20px; background: white; border: 2px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <img src="{{qrCodeImage}}" alt="Student QR Code" style="width: 200px; height: 200px; display: block;" />
        <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">Scan for quick attendance</p>
      </div>
    </div>
    
    <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">📱 How to use your QR code:</h3>
      <ol style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0;">
        <li style="margin-bottom: 10px;">Show this QR code to your instructor for attendance tracking</li>
        <li style="margin-bottom: 10px;">Keep it saved on your mobile device for easy access</li>
        <li style="margin-bottom: 10px;">This QR code contains your student ID and profile information</li>
        <li style="margin-bottom: 0;">If you lose this email, contact administration for a new QR code</li>
      </ol>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
      <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
        <strong>⚠️ Important:</strong> Keep this QR code secure. Do not share it with others.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
        If you have any questions, please contact:<br>
        📧 support@cslh.qa | 📞 +974 XXXX XXXX
      </p>
    </div>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background: #f5f5f5; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 5px 0;">This is an automated email from {{siteName}}.</p>
    <p style="margin: 0 0 5px 0;">If you did not request this QR code, please contact support immediately.</p>
    <p style="margin: 15px 0 0 0; font-weight: bold;">{{currentDate}} (Qatar Time UTC+3)</p>
  </div>
</div>`,
      variables: ["studentName", "studentId", "studentEmail", "qrCodeImage", "siteName", "currentDate"],
      enabled: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  try {
    for (const template of qrTemplates) {
      await db.collection('emailTemplates').doc(template.id).set(template);
      console.log(`✅ Created template: ${template.name}`);
    }
    console.log('🎉 QR Code templates created successfully!');
    console.log('🔄 Refresh your Email Templates page to see the new templates.');
  } catch (error) {
    console.error('❌ Error creating templates:', error);
  }
};

createQRTemplates();
