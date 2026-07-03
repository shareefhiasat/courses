const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the createResource data section
const oldDataSection = `  data: {
        titleEn: resourceData.titleEn,
        titleAr: resourceData.titleAr,
        descriptionEn: resourceData.descriptionEn,
        descriptionAr: resourceData.descriptionAr,
        resourceType: {
          connect: { id: resourceData.typeId || (resourceData.type === 'link' ? 1 : 2) }
        },
        category: resourceData.categoryId ? {
          connect: { id: parseInt(resourceData.categoryId) }
        } : undefined,
        tags: resourceData.tags,
        fileUrl: resourceData.url || resourceData.fileUrl,
        fileName: resourceData.fileName,
        fileSize: resourceData.fileSize,
        fileType: resourceData.type || 'link',
        downloadCount: 0,
        dueDate: resourceData.dueDate,
        isRequired: !(resourceData.optional || false),
        isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,
        featured: resourceData.featured || false,`;

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
        typeId: resourceData.typeId || 1,
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

console.log('✅ Updated createResource function with correct field mappings');
console.log('   - Removed fileName, fileSize, tags');
console.log('   - Renamed fileUrl -> url');
console.log('   - Renamed fileType -> type');
console.log('   - Fixed categoryId handling');
console.log('   - Fixed isRequired logic');
console.log('   - Fixed featured field');
