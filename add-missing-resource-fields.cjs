const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find the createResource data section and add missing fields
const oldDataSection = `        fileUrl: resourceData.url || resourceData.fileUrl,
        fileName: resourceData.fileName,
        fileSize: resourceData.fileSize,
        fileType: resourceData.fileType,
        downloadCount: 0,
        isRequired: !(resourceData.optional || false),
        isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,`;

const newDataSection = `        fileUrl: resourceData.url || resourceData.fileUrl,
        fileName: resourceData.fileName,
        fileSize: resourceData.fileSize,
        fileType: resourceData.type || 'link',
        downloadCount: 0,
        dueDate: resourceData.dueDate,
        isRequired: !(resourceData.optional || false),
        isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,
        featured: resourceData.featured || false,`;

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

console.log('✅ Added missing fields to createResource function');
console.log('   - dueDate');
console.log('   - featured');
console.log('   - fileType (from type field)');
