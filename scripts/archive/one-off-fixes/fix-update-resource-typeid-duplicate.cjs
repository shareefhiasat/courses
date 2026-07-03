const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the updateResource data section - remove typeId since it's handled by resourceType relation
const oldUpdateSection = `    // Only include fields that are provided
    if (updateData.titleEn !== undefined) data.titleEn = updateData.titleEn;
    if (updateData.titleAr !== undefined) data.titleAr = updateData.titleAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.url !== undefined) data.url = updateData.url;
    if (updateData.type !== undefined) data.type = updateData.type;
    if (updateData.typeId !== undefined) data.typeId = updateData.typeId;
    if (updateData.categoryId !== undefined) data.categoryId = updateData.categoryId;
    if (updateData.dueDate !== undefined) data.dueDate = updateData.dueDate;
    if (updateData.isRequired !== undefined) data.isRequired = updateData.isRequired;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updateData.featured !== undefined) data.featured = updateData.featured;
    if (updateData.programId !== undefined) data.programId = updateData.programId;
    if (updateData.subjectId !== undefined) data.subjectId = updateData.subjectId;
    if (updateData.classId !== undefined) data.classId = updateData.classId;`;

const newUpdateSection = `    // Only include fields that are provided
    if (updateData.titleEn !== undefined) data.titleEn = updateData.titleEn;
    if (updateData.titleAr !== undefined) data.titleAr = updateData.titleAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.url !== undefined) data.url = updateData.url;
    if (updateData.type !== undefined) data.type = updateData.type;
    if (updateData.categoryId !== undefined) data.categoryId = updateData.categoryId;
    if (updateData.dueDate !== undefined) data.dueDate = updateData.dueDate;
    if (updateData.isRequired !== undefined) data.isRequired = updateData.isRequired;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updateData.featured !== undefined) data.featured = updateData.featured;
    if (updateData.programId !== undefined) data.programId = updateData.programId;
    if (updateData.subjectId !== undefined) data.subjectId = updateData.subjectId;
    if (updateData.classId !== undefined) data.classId = updateData.classId;`;

// Replace in updateResource function
const updateResourceStart = content.indexOf('export const updateResource');
const updateResourceEnd = content.indexOf('export const deleteResource');
const updateResourceSection = content.substring(updateResourceStart, updateResourceEnd);

// Replace data section
const updatedSection = updateResourceSection.replace(oldUpdateSection, newUpdateSection);

// Rebuild the full content
const newContent = content.substring(0, updateResourceStart) + 
                   updatedSection + 
                   content.substring(updateResourceEnd);

// Write back to file
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Fixed updateResource function - removed duplicate typeId field');
console.log('   - typeId is handled by resourceType relation');
console.log('   - type field stores the string value (link, file, etc.)');
