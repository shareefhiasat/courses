const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createResourceTypes() {
  try {
    const types = await prisma.resourceTypes.findMany();
    console.log('Existing Resource Types:', types.length);
    
    if (types.length === 0) {
      console.log('Creating default resource types...');
      await prisma.resourceTypes.createMany({
        data: [
          { code: 'link', nameEn: 'Link', nameAr: 'رابط' },
          { code: 'file', nameEn: 'File', nameAr: 'ملف' },
          { code: 'video', nameEn: 'Video', nameAr: 'فيديو' },
          { code: 'document', nameEn: 'Document', nameAr: 'وثيقة' }
        ]
      });
      console.log('✅ Created default resource types');
    } else {
      console.log('✅ Resource types already exist');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createResourceTypes();
