const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCategoryTypes() {
  try {
    const categories = await prisma.categoryTypes.findMany();
    console.log('Existing Category Types:', categories.length);
    
    if (categories.length === 0) {
      console.log('Creating default category types...');
      await prisma.categoryTypes.createMany({
        data: [
          { code: 'general', nameEn: 'General', nameAr: 'عام' },
          { code: 'assignment', nameEn: 'Assignment', nameAr: 'واجب' },
          { code: 'reading', nameEn: 'Reading', nameAr: 'قراءة' },
          { code: 'reference', nameEn: 'Reference', nameAr: 'مرجع' },
          { code: 'media', nameEn: 'Media', nameAr: 'وسائط' }
        ]
      });
      console.log('✅ Created default category types');
    } else {
      console.log('✅ Category types already exist');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCategoryTypes();
