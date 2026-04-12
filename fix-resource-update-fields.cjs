const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the updateResource data section
const oldUpdateSection = `    // Only include fields that are provided
    if (updateData.titleEn !== undefined) data.titleEn = updateData.titleEn;
    if (updateData.titleAr !== undefined) data.titleAr = updateData.titleAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.type !== undefined) data.type = updateData.type;
    if (updateData.category !== undefined) data.category = updateData.category;
    if (updateData.tags !== undefined) data.tags = updateData.tags;
    if (updateData.fileUrl !== undefined) data.fileUrl = updateData.fileUrl;
    if (updateData.fileName !== undefined) data.fileName = updateData.fileName;
    if (updateData.fileSize !== undefined) data.fileSize = updateData.fileSize;
    if (updateData.fileType !== undefined) data.fileType = updateData.fileType;
    if (updateData.isRequired !== undefined) data.isRequired = updateData.isRequired;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
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
    if (updateData.typeId !== undefined) data.typeId = updateData.typeId;
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

console.log('✅ Updated updateResource function with correct field mappings');
console.log('   - Removed fileName, fileSize, tags');
console.log('   - Renamed fileUrl -> url');
console.log('   - Renamed fileType -> type');
console.log('   - Added typeId field');
console.log('   - Added categoryId field');
console.log('   - Added dueDate field');
console.log('   - Added featured field');
