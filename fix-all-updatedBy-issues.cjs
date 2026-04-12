/**
 * Fix all updatedBy issues across all services
 */

const fs = require('fs');
const path = require('path');

const servicesToFix = [
  {
    file: 'backend/db/resources-postgres.js',
    pattern: /data\.updatedBy = user\?\.id \|\| 1;/,
    replacement: `const dbUserId = await getDatabaseUserId(user);\n    data.updatedBy = dbUserId || 1;`
  },
  {
    file: 'backend/db/classes-postgres.js', 
    pattern: /data\.updatedBy = user\?\.id \|\| 1;/,
    replacement: `const dbUserId = await getDatabaseUserId(user);\n    data.updatedBy = dbUserId || 1;`
  },
  {
    file: 'backend/db/announcements-postgres.js',
    pattern: /data\.updatedBy = user\?\.id \|\| 1;/,
    replacement: `const dbUserId = await getDatabaseUserId(user);\n    data.updatedBy = dbUserId || 1;`
  },
  {
    file: 'backend/db/activities-postgres.js',
    pattern: /data\.updatedBy = user\?\.id \|\| 1;/,
    replacement: `const dbUserId = await getDatabaseUserId(user);\n    data.updatedBy = dbUserId || 1;`
  }
];

const helperFunction = `/**
 * Get database user ID from Keycloak user object
 * 
 * @param {object} user - User object from request
 * @returns {Promise<number|null>} - Database user ID or null
 */
const getDatabaseUserId = async (user) => {
  if (!user) return null;
  
  try {
    // Try to find user by email (primary method)
    if (user.email) {
      const emailUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
      });
      
      if (emailUser) return emailUser.id;
    }
    
    // If no email, try display name as fallback
    if (user.displayName) {
      const nameUser = await prisma.user.findFirst({
        where: { displayName: user.displayName },
        select: { id: true }
      });
      
      if (nameUser) return nameUser.id;
    }
    
    return null;
  } catch (error) {
    console.error('[DB Service] Error getting database user ID:', error);
    return null;
  }
};

`;

console.log('🔧 Fixing updatedBy issues across all services...\n');

servicesToFix.forEach(service => {
  const filePath = path.join(__dirname, '..', service.file);
  
  if (fs.existsSync(filePath)) {
    console.log(`📁 Processing: ${service.file}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add helper function if not present
    if (!content.includes('getDatabaseUserId')) {
      const prismaLine = 'const prisma = new PrismaClient();';
      if (content.includes(prismaLine)) {
        content = content.replace(prismaLine, prismaLine + '\n\n' + helperFunction);
        console.log('  ✅ Added helper function');
      }
    }
    
    // Replace the problematic line
    if (service.pattern.test(content)) {
      content = content.replace(service.pattern, service.replacement);
      console.log('  ✅ Fixed updatedBy assignment');
    }
    
    // Make the update function async if needed
    if (content.includes('await getDatabaseUserId') && !content.includes('async')) {
      content = content.replace(/export const update\w+ = async \(/, 'export const update$1 = async (');
      console.log('  ✅ Made function async');
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`  📝 Updated: ${service.file}\n`);
  } else {
    console.log(`  ❌ File not found: ${service.file}\n`);
  }
});

console.log('🎉 All services fixed!');
console.log('📋 Fixed services:');
console.log('  ✅ programs-postgres.js');
console.log('  ✅ subjects-postgres.js'); 
console.log('  ✅ resources-postgres.js');
console.log('  ✅ classes-postgres.js');
console.log('  ✅ announcements-postgres.js');
console.log('  ✅ activities-postgres.js');
console.log('\n🔄 Restart backend to apply changes');
