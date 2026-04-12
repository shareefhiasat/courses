const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find the createResource data section and fix field mapping
const oldDataSection = `  data: {
        titleEn: resourceData.titleEn,
        titleAr: resourceData.titleAr,
        descriptionEn: resourceData.descriptionEn,
        descriptionAr: resourceData.descriptionAr,
        resourceType: {
          connect: { id: resourceData.typeId || 1 }
        },
        category: resourceData.category ? {
          connect: { id: parseInt(resourceData.category) }
        } : undefined,
        tags: resourceData.tags,
        fileUrl: resourceData.fileUrl,
        fileName: resourceData.fileName,
        fileSize: resourceData.fileSize,
        fileType: resourceData.fileType,
        downloadCount: 0,
        isRequired: resourceData.isRequired !== undefined ? resourceData.isRequired : false,
        isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,`;

const newDataSection = `  data: {
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
        fileType: resourceData.fileType,
        downloadCount: 0,
        isRequired: !(resourceData.optional || false),
        isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,`;

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

console.log('✅ Fixed field mapping in createResource function');
console.log('   - url -> fileUrl');
console.log('   - type -> typeId (with default mapping)');
console.log('   - optional -> isRequired (inverted logic)');
console.log('   - categoryId -> category (fixed connection)');
