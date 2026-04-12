const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the createResource data section - remove typeId since it's handled by resourceType relation
const oldDataSection = `  data: {
        titleEn: resourceData.titleEn,
        titleAr: resourceData.titleAr,
        descriptionEn: resourceData.descriptionEn,
        descriptionAr: resourceData.descriptionAr,
        resourceType: {
          connect: { id: resourceData.typeId || 1 }
        },
        category: resourceData.categoryId && resourceData.categoryId !== '' ? {
          connect: { id: parseInt(resourceData.categoryId) }
        } : undefined,
        url: resourceData.url,
        type: resourceData.type || 'link',
        typeId: resourceData.typeId || 1,
        downloadCount: 0,
        dueDate: resourceData.dueDate,
        isRequired: resourceData.isRequired !== undefined ? resourceData.isRequired : false,
        isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,
        featured: resourceData.featured !== undefined ? resourceData.featured : false,`;

const newDataSection = `  data: {
        titleEn: resourceData.titleEn,
        titleAr: resourceData.titleAr,
        descriptionEn: resourceData.descriptionEn,
        descriptionAr: resourceData.descriptionAr,
        resourceType: {
          connect: { id: resourceData.typeId || 1 }
        },
        category: resourceData.categoryId && resourceData.categoryId !== '' ? {
          connect: { id: parseInt(resourceData.categoryId) }
        } : undefined,
        url: resourceData.url,
        type: resourceData.type || 'link',
        downloadCount: 0,
        dueDate: resourceData.dueDate,
        isRequired: resourceData.isRequired !== undefined ? resourceData.isRequired : false,
        isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,
        featured: resourceData.featured !== undefined ? resourceData.featured : false,`;

// Replace in createResource function
const createResourceStart = content.indexOf('export const createResource');
const createResourceEnd = content.indexOf('export const updateResource');
const createResourceSection = content.substring(createResourceStart, createResourceEnd);

// Replace data section
const updatedSection = createResourceSection.replace(oldDataSection, newDataSection);

// Rebuild the full content
const newContent = content.substring(0, createResourceStart) + 
                   updatedSection + 
                   content.substring(createResourceEnd);

// Write back to file
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Fixed createResource function - removed duplicate typeId field');
console.log('   - typeId is handled by resourceType relation');
console.log('   - type field stores the string value (link, file, etc.)');
