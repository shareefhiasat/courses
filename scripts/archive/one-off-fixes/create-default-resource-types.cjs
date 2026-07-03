const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDefaultResourceTypes() {
  try {
    console.log('Creating default resource types...');

    const defaultResourceTypes = [
      {
        code: 'LINK',
        nameEn: 'Link',
        nameAr: 'رابط',
        descriptionEn: 'External link resource',
        descriptionAr: 'مصدر الرابط الخارجي',
        icon: 'link',
        color: '#3B82F6',
        isActive: true
      },
      {
        code: 'DOCUMENT',
        nameEn: 'Document',
        nameAr: 'مستند',
        descriptionEn: 'Document file resource',
        descriptionAr: 'مصدر الملف المستند',
        icon: 'file-text',
        color: '#10B981',
        isActive: true
      },
      {
        code: 'VIDEO',
        nameEn: 'Video',
        nameAr: 'فيديو',
        descriptionEn: 'Video resource',
        descriptionAr: 'مصدر الفيديو',
        icon: 'video',
        color: '#EF4444',
        isActive: true
      },
      {
        code: 'IMAGE',
        nameEn: 'Image',
        nameAr: 'صورة',
        descriptionEn: 'Image resource',
        descriptionAr: 'مصدر الصورة',
        icon: 'image',
        color: '#F59E0B',
        isActive: true
      },
      {
        code: 'AUDIO',
        nameEn: 'Audio',
        nameAr: 'صوت',
        descriptionEn: 'Audio resource',
        descriptionAr: 'مصدر الصوت',
        icon: 'music',
        color: '#8B5CF6',
        isActive: true
      },
      {
        code: 'ARCHIVE',
        nameEn: 'Archive',
        nameAr: 'أرشيف',
        descriptionEn: 'Archive file resource',
        descriptionAr: 'مصدر الملف الأرشيف',
        icon: 'archive',
        color: '#6B7280',
        isActive: true
      },
      {
        code: 'PRESENTATION',
        nameEn: 'Presentation',
        nameAr: 'عرض تقديمي',
        descriptionEn: 'Presentation file resource',
        descriptionAr: 'مصدر ملف العرض التقديمي',
        icon: 'presentation',
        color: '#EC4899',
        isActive: true
      },
      {
        code: 'SPREADSHEET',
        nameEn: 'Spreadsheet',
        nameAr: 'جدول بيانات',
        descriptionEn: 'Spreadsheet file resource',
        descriptionAr: 'مصدر ملف جدول البيانات',
        icon: 'spreadsheet',
        color: '#059669',
        isActive: true
      }
    ];

    for (const resourceType of defaultResourceTypes) {
      // Check if resource type already exists
      const existing = await prisma.resourceTypes.findUnique({
        where: { code: resourceType.code }
      });

      if (!existing) {
        await prisma.resourceTypes.create({
          data: {
            ...resourceType,
            createdBy: 1 // Default admin user
          }
        });
        console.log(`✅ Created resource type: ${resourceType.code}`);
      } else {
        console.log(`⚠️  Resource type already exists: ${resourceType.code}`);
      }
    }

    console.log('\n🎉 Default resource types created successfully!');
    
    // Show all resource types
    const allResourceTypes = await prisma.resourceTypes.findMany({
      orderBy: { code: 'asc' }
    });
    
    console.log('\n📋 All Resource Types:');
    allResourceTypes.forEach(rt => {
      console.log(`  ${rt.id}: ${rt.code} - ${rt.nameEn} / ${rt.nameAr}`);
    });

  } catch (error) {
    console.error('❌ Error creating default resource types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultResourceTypes();
