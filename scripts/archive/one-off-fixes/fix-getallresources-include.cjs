const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the getAllResources function include section
const oldIncludeSection = `      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      }`;

const newIncludeSection = `      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        subject: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        category: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        resourceType: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      }`;

// Replace in getAllResources function (first occurrence)
const getAllResourcesStart = content.indexOf('export const getAllResources');
const getAllResourcesEnd = content.indexOf('export const getResourceById');
const getAllResourcesSection = content.substring(getAllResourcesStart, getAllResourcesEnd);

// Replace include section
const updatedSection = getAllResourcesSection.replace(oldIncludeSection, newIncludeSection);

// Rebuild the full content
const newContent = content.substring(0, getAllResourcesStart) + 
                   updatedSection + 
                   content.substring(getAllResourcesEnd);

// Write back to file
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Fixed getAllResources function - added missing category and resourceType to include');
console.log('   - category: now included with id, nameEn, nameAr');
console.log('   - resourceType: now included with id, nameEn, nameAr');
console.log('   - This will fix the dropdown selection issue in edit mode');
