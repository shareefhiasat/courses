require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

async function migrateHelpItems() {
  console.log(' Migrating help items to database...');
    titleAr: 'تعديل المستخدم',
    contentEn: 'Update user details such as display name, real name, and role.',
    contentAr: 'تحديث تفاصيل المستخدم مثل الاسم المعروض، الاسم الحقيقي، والدور.',
    order: 1
  },
  {
    page: 'users',
    section: 'actions',
    key: 'help_user_impersonate',
    titleEn: 'Impersonate User',
    titleAr: 'تقمص شخصية المستخدم',
    contentEn: 'View the platform as if you were this student (student role only).',
    contentAr: 'عرض المنصة كما لو كنت هذا الطالب (دور الطالب فقط).',
    order: 2
  },
  {
    page: 'users',
    section: 'actions',
    key: 'help_user_reset',
    titleEn: 'Reset Password',
    titleAr: 'إعادة تعيين كلمة المرور',
    contentEn: 'Send a password reset email to the user.',
    contentAr: 'إرسال بريد إلكتروني لإعادة تعيين كلمة المرور للمستخدم.',
    order: 3
  },
  {
    page: 'users',
    section: 'actions',
    key: 'help_user_disable',
    titleEn: 'Disable/Enable User',
    titleAr: 'تعطيل/تمكين المستخدم',
    contentEn: 'Temporarily disable or re-enable a user account.',
    contentAr: 'تعطيل أو إعادة تمكين حساب مستخدم مؤقتاً.',
    order: 4
  },

  // Resources page help items
  {
    page: 'resources',
    section: 'purpose',
    key: 'help_resources_purpose',
    titleEn: 'Resources Management Purpose',
    titleAr: 'غرض إدارة الموارد',
    contentEn: 'Share additional learning materials like documents, videos, and links with your students.',
    contentAr: 'مشاركة المواد التعليمية الإضافية مثل المستندات ومقاطع الفيديو والروابط مع طلابك.',
    order: 1
  },
  {
    page: 'resources',
    section: 'scope',
    key: 'help_resources_scope',
    titleEn: 'Resource Scope',
    titleAr: 'نطاق الموارد',
    contentEn: 'Resources can be public (visible to everyone) or targeted to specific programs, subjects, or classes. Public resources are always listed regardless of filters.',
    contentAr: 'يمكن أن تكون الموارد عامة (مرئية للجميع) أو مستهدفة لبرامج أو مواد أو فصول محددة. الموارد العامة دائماً مدرجة في الأعداد بغض النظر عن عوامل التصفية.',
    order: 1
  },
  {
    page: 'resources',
    section: 'types',
    key: 'help_resource_document',
    titleEn: 'Document Resources',
    titleAr: 'موارد المستندات',
    contentEn: 'PDF files, Word documents, presentations, and other downloadable files.',
    contentAr: 'ملفات PDF، مستندات Word، عروض تقديمية، وملفات أخرى قابلة للتنزيل.',
    order: 1
  },
  {
    page: 'resources',
    section: 'types',
    key: 'help_resource_video',
    titleEn: 'Video Resources',
    titleAr: 'موارد الفيديو',
    contentEn: 'Video lectures, tutorials, recordings, and other video content.',
    contentAr: 'محاضرات فيديو، دروس تعليمية، تسجيلات، ومحتوى فيديو آخر.',
    order: 2
  },
  {
    page: 'resources',
    section: 'types',
    key: 'help_resource_audio',
    titleEn: 'Audio Resources',
    titleAr: 'موارد الصوت',
    contentEn: 'Audio lectures, podcasts, music files, and other audio content.',
    contentAr: 'محاضرات صوتية، بودكاست، ملفات موسيقى، ومحتوى صوتي آخر.',
    order: 3
  },
  {
    page: 'resources',
    section: 'types',
    key: 'help_resource_link',
    titleEn: 'Link Resources',
    titleAr: 'موارد الروابط',
    contentEn: 'External websites, online tools, and other web resources.',
    contentAr: 'مواقع الويب الخارجية، الأدوات عبر الإنترنت، وموارد الويب الأخرى.',
    order: 4
  },
  {
    page: 'resources',
    section: 'types',
    key: 'help_resource_archive',
    titleEn: 'Archive Resources',
    titleAr: 'موارد الأرشيف',
    contentEn: 'Compressed files containing multiple documents or resources.',
    contentAr: 'ملفات مضغوطة تحتوي على مستندات أو موارد متعددة.',
    order: 5
  },

  // Activities page help items
  {
    page: 'activities',
    section: 'purpose',
    key: 'help_activities_purpose',
    titleEn: 'Activities Management Purpose',
    titleAr: 'غرض إدارة الأنشطة',
    contentEn: 'Manage educational activities like quizzes, assignments, and exercises. Assign them to specific programs, subjects, or classes.',
    contentAr: 'إدارة الأنشطة التعليمية مثل الاختبارات والواجبات والتدريبات. تعيينها لبرامج أو مواد أو فصول محددة.',
    order: 1
  },
  {
    page: 'activities',
    section: 'overview',
    key: 'help_activities_cards',
    titleEn: 'Summary Cards',
    titleAr: 'بطاقات الملخص',
    contentEn: 'Summary cards at the top show filtered counts. Use program/subject/class filters to see counts for specific scopes.',
    contentAr: 'تظهر بطاقات الملخص في الأعلى الأعداد المفلترة. استخدم عوامل التصفية البرنامج/المادة/الصف لرؤية الأعداد لنطاقات محددة.',
    order: 1
  },
  {
    page: 'activities',
    section: 'types',
    key: 'help_activity_quiz',
    titleEn: 'Quiz Activities',
    titleAr: 'أنشطة الاختبارات',
    contentEn: 'Interactive quizzes with questions and automatic grading. Can be linked to existing quiz templates.',
    contentAr: 'اختبارات تفاعلية مع أسئلة وتقييم تلقائي. يمكن ربطها بقوالب اختبار موجودة.',
    order: 1
  },
  {
    page: 'activities',
    section: 'types',
    key: 'help_activity_assignment',
    titleEn: 'Assignment Activities',
    titleAr: 'أنشطة الواجبات',
    contentEn: 'Homework assignments, projects, and other tasks that students submit for grading.',
    contentAr: 'واجبات منزلية، مشاريع، ومهام أخرى يقدمها الطلاب للتقييم.',
    order: 2
  },
  {
    page: 'activities',
    section: 'types',
    key: 'help_activity_lab',
    titleEn: 'Lab Activities',
    titleAr: 'أنشطة المختبر',
    contentEn: 'Hands-on projects and lab work that require submissions.',
    contentAr: 'مشاريع عملية وأعمال مختبرية تتطلب التسليم.',
    order: 3
  },

  // Programs page help items
  {
    page: 'programs',
    section: 'purpose',
    key: 'help_programs_purpose',
    titleEn: 'Programs Management Purpose',
    titleAr: 'غرض إدارة البرامج',
    contentEn: 'Define high-level academic programs that group related subjects together.',
    contentAr: 'تعريف البرامج الأكاديمية عالية المستوى التي تجمع المواد ذات الصلة معاً.',
    order: 1
  },
  {
    page: 'programs',
    section: 'fields',
    key: 'help_program_id',
    titleEn: 'Program ID',
    titleAr: 'معرف البرنامج',
    contentEn: 'Unique identifier for the program.',
    contentAr: 'معرف فريد للبرنامج.',
    order: 1
  },
  {
    page: 'programs',
    section: 'fields',
    key: 'help_program_name',
    titleEn: 'Program Name',
    titleAr: 'اسم البرنامج',
    contentEn: 'Program name in both English and Arabic.',
    contentAr: 'اسم البرنامج باللغتين الإنجليزية والعربية.',
    order: 2
  },
  {
    page: 'programs',
    section: 'fields',
    key: 'help_program_code',
    titleEn: 'Program Code',
    titleAr: 'رمز البرنامج',
    contentEn: 'Short code for the program (like CS, ENG).',
    contentAr: 'رمز قصير للبرنامج (مثل CS, ENG).',
    order: 3
  },

  // Subjects page help items
  {
    page: 'subjects',
    section: 'purpose',
    key: 'help_subjects_purpose',
    titleEn: 'Subjects Management Purpose',
    titleAr: 'غرض إدارة المواد',
    contentEn: 'Manage subjects within programs. Subjects are containers for classes and activities.',
    contentAr: 'إدارة المواد داخل البرامج. المواد هي حاويات للفصول والأنشطة.',
    order: 1
  },
  {
    page: 'subjects',
    section: 'fields',
    key: 'help_subject_id',
    titleEn: 'Subject ID',
    titleAr: 'معرف المادة',
    contentEn: 'Unique identifier for the subject.',
    contentAr: 'معرف فريد للمادة.',
    order: 1
  },
  {
    page: 'subjects',
    section: 'fields',
    key: 'help_subject_program',
    titleEn: 'Subject Program',
    titleAr: 'برنامج المادة',
    contentEn: 'The program this subject belongs to.',
    contentAr: 'البرنامج الذي تنتمي إليه هذه المادة.',
    order: 2
  },
  {
    page: 'subjects',
    section: 'fields',
    key: 'help_subject_name',
    titleEn: 'Subject Name',
    titleAr: 'اسم المادة',
    contentEn: 'Subject name in both English and Arabic.',
    contentAr: 'اسم المادة باللغتين الإنجليزية والعربية.',
    order: 3
  },

  // Classes page help items
  {
    page: 'classes',
    section: 'purpose',
    key: 'help_classes_purpose',
    titleEn: 'Classes Management Purpose',
    titleAr: 'غرض إدارة الفصول',
    contentEn: 'Create and manage specific class sections for subjects, assign them to instructors and academic terms.',
    contentAr: 'إنشاء وإدارة فصول محددة للمواد، وتعيينها للمعلمين والفصول الدراسية.',
    order: 1
  },
  {
    page: 'classes',
    section: 'fields',
    key: 'help_class_name',
    titleEn: 'Class Name',
    titleAr: 'اسم الفصل',
    contentEn: 'Descriptive name for the class.',
    contentAr: 'اسم وصفي للفصل.',
    order: 1
  },
  {
    page: 'classes',
    section: 'fields',
    key: 'help_class_subject',
    titleEn: 'Class Subject',
    titleAr: 'مادة الفصل',
    contentEn: 'The subject this class teaches.',
    contentAr: 'المادة التي يدرسها هذا الفصل.',
    order: 2
  },
  {
    page: 'classes',
    section: 'fields',
    key: 'help_class_term',
    titleEn: 'Class Term',
    titleAr: 'فصل الفصل',
    contentEn: 'Academic term (like Fall 2024).',
    contentAr: 'الفصل الدراسي (مثل خريف 2024).',
    order: 3
  },
  {
    page: 'classes',
    section: 'fields',
    key: 'help_class_instructor',
    titleEn: 'Class Instructor',
    titleAr: 'معلم الفصل',
    contentEn: 'Primary instructor for this class.',
    contentAr: 'المعلم الأساسي لهذا الفصل.',
    order: 4
  },

  // Allowlist page help items
  {
    page: 'allowlist',
    section: 'purpose',
    key: 'help_allowlist_purpose',
    titleEn: 'Allowlist Management Purpose',
    titleAr: 'غرض إدارة القائمة البيضاء',
    contentEn: 'Control who can register and access the platform by managing allowed email addresses. Only users with email addresses on this list will be able to sign up and log in to the system.',
    contentAr: 'التحكم في من يمكنه التسجيل والوصول إلى المنصة من خلال إدارة عناوين البريد الإلكتروني المسموح بها. فقط المستخدمون الذين لديهم عناوين بريد إلكتروني في هذه القائمة يمكنهم التسجيل والوصول إلى النظام.',
    order: 1
  },
  {
    page: 'allowlist',
    section: 'types',
    key: 'help_allowlist_student',
    titleEn: 'Student Allowlist',
    titleAr: 'قائمة الطلاب المسموح بها',
    contentEn: 'Email addresses that are allowed to register and access the platform as students. Students must use an email address from this list to register.',
    contentAr: 'عناوين البريد الإلكتروني للطلاب المسموح لهم بالتسجيل والوصول إلى المنصة. يجب على الطلاب استخدام عنوان بريد إلكتروني من هذه القائمة للتسجيل.',
    order: 1
  },
  {
    page: 'allowlist',
    section: 'types',
    key: 'help_allowlist_admin',
    titleEn: 'Admin Allowlist',
    titleAr: 'قائمة المشرفين المسموح بها',
    contentEn: 'Email addresses that are allowed to access the admin dashboard and administrative features. Admins must use an email address from this list to gain dashboard access.',
    contentAr: 'عناوين البريد الإلكتروني للمشرفين المسموح لهم بالوصول إلى لوحة التحكم والميزات الإدارية. يجب على المشرفين استخدام عنوان بريد إلكتروني من هذه القائمة للحصول على وصول لوحة التحكم.',
    order: 2
  }
];

async function migrateHelpItems() {
  console.log('🔄 Starting help items migration...');
  
  try {
    // Get existing help items to avoid duplicates
    const existingItems = await prisma.helpItems.findMany({
      select: { key: true, page: true, section: true }
    });
    
    const existingKeys = new Set(
      existingItems.map(item => `${item.page}-${item.section}-${item.key}`)
    );
    
    console.log(`📊 Found ${existingItems.length} existing help items`);
    
    // Filter out items that already exist
    const newItems = helpItemsFromLangContext.filter(item => 
      !existingKeys.has(`${item.page}-${item.section}-${item.key}`)
    );
    
    console.log(`📝 Found ${newItems.length} new help items to migrate`);
    
    if (newItems.length === 0) {
      console.log('✅ All help items already exist in database');
      return;
    }
    
    // Insert new help items
    const insertPromises = newItems.map(item => 
      prisma.helpItems.create({
        data: {
          ...item,
          createdBy: superAdminId, // Using dynamic super admin ID
          updatedBy: superAdminId
        }
      })
    );
    
    const results = await Promise.all(insertPromises);
    
    console.log(`✅ Successfully migrated ${results.length} help items to database`);
    
    // Show summary by page
    const pageSummary = {};
    results.forEach(item => {
      if (!pageSummary[item.page]) {
        pageSummary[item.page] = 0;
      }
      pageSummary[item.page]++;
    });
    
    console.log('\n📋 Migration Summary by Page:');
    Object.entries(pageSummary).forEach(([page, count]) => {
      console.log(`  • ${page}: ${count} items`);
    });
    
  } catch (error) {
    console.error('❌ Error migrating help items:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateHelpItems()
    .then(() => {
      console.log('\n🎉 Help items migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Help items migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateHelpItems, helpItemsFromLangContext };
