/**
 * Get Super Admin Helper
 * 
 * PURPOSE: Helper function to get the super admin user ID dynamically
 * This ensures we always use the correct super admin ID instead of hardcoded values
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get the super admin user ID
 * @returns {Promise<number|null>} The super admin user ID or null if not found
 */
async function getSuperAdminId() {
  try {
    const superAdmin = await prisma.user.findFirst({
      where: {
        roleAssignments: {
          some: {
            role: {
              code: 'SUPER_ADMIN'
            }
          }
        }
      }
    });

    if (!superAdmin) {
      console.error('❌ Super admin user not found!');
      return null;
    }

    console.log(`✅ Found super admin: ID=${superAdmin.id}, Email=${superAdmin.email}`);
    return superAdmin.id;
  } catch (error) {
    console.error('❌ Error getting super admin ID:', error);
    return null;
  }
}

/**
 * Get the super admin user object
 * @returns {Promise<object|null>} The super admin user object or null if not found
 */
async function getSuperAdmin() {
  try {
    const superAdmin = await prisma.user.findFirst({
      where: {
        roleAssignments: {
          some: {
            role: {
              code: 'SUPER_ADMIN'
            }
          }
        }
      }
    });

    if (!superAdmin) {
      console.error('❌ Super admin user not found!');
      return null;
    }

    return superAdmin;
  } catch (error) {
    console.error('❌ Error getting super admin:', error);
    return null;
  }
}

module.exports = {
  getSuperAdminId,
  getSuperAdmin
};
