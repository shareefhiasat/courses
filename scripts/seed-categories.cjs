/**
 * Seed script to add sample categories for categorization
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleCategories = [
  {
    code: 'ACADEMIC',
    nameEn: 'Academic',
    nameAr: 'أكاديمي',
    descriptionEn: 'Academic resources and materials',
    descriptionAr: 'الموارد والمواد الأكاديمية',
    icon: 'book',
    color: '#3b82f6',
    sort: 1,
    isActive: true
  },
  {
    code: 'ADMINISTRATIVE',
    nameEn: 'Administrative',
    nameAr: 'إداري',
    descriptionEn: 'Administrative documents and forms',
    descriptionAr: 'الوثائق والنماذج الإدارية',
    icon: 'file',
    color: '#10b981',
    sort: 2,
    isActive: true
  },
  {
    code: 'TECHNICAL',
    nameEn: 'Technical',
    nameAr: 'تقني',
    descriptionEn: 'Technical guides and documentation',
    descriptionAr: 'الأدلة والوثائق التقنية',
    icon: 'settings',
    color: '#f59e0b',
    sort: 3,
    isActive: true
  },
  {
    code: 'GENERAL',
    nameEn: 'General',
    nameAr: 'عام',
    descriptionEn: 'General information and resources',
    descriptionAr: 'معلومات وموارد عامة',
    icon: 'folder',
    color: '#8b5cf6',
    sort: 4,
    isActive: true
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Seeding sample categories...');

    // Get or create a default user
    let defaultUser = await prisma.user.findFirst({
      where: { id: 1 }
    });

    if (!defaultUser) {
      console.log('👤 Creating default user...');
      
      // Get or create SUPER_ADMIN role
      let adminRole = await prisma.userRoles.findFirst({
        where: { code: 'SUPER_ADMIN' }
      });
      
      if (!adminRole) {
        console.log('🔑 Creating SUPER_ADMIN role...');
        adminRole = await prisma.userRoles.create({
          data: {
            code: 'SUPER_ADMIN',
            nameEn: 'Super Admin',
            nameAr: 'مدير عام',
            level: 100,
            isActive: true
          }
        });
      }

      // Create default user
      defaultUser = await prisma.user.create({
        data: {
          email: 'admin@courses.com',
          displayName: 'System Admin',
          firstName: 'System',
          lastName: 'Admin',
          roleId: adminRole.id,
          isActive: true
        }
      });
      
      console.log(`✅ Created default user: ${defaultUser.displayName} (ID: ${defaultUser.id})`);
    }

    console.log(`👤 Using user: ${defaultUser.displayName || defaultUser.email} (ID: ${defaultUser.id})`);

    // Clear existing categories (optional - comment out if you want to keep existing)
    await prisma.categoryTypes.deleteMany();
    console.log('🧹 Cleared existing categories');

    // Create sample categories
    for (const category of sampleCategories) {
      const createdCategory = await prisma.categoryTypes.create({
        data: {
          ...category,
          createdBy: defaultUser.id,
          updatedBy: defaultUser.id
        }
      });
      console.log(`✅ Created category: ${createdCategory.nameEn} (${createdCategory.code})`);
    }

    console.log('🎉 Sample categories seeded successfully!');
    
    // Display summary
    const totalCategories = await prisma.categoryTypes.count();
    console.log(`📊 Total categories in database: ${totalCategories}`);

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedCategories();
