const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find the updateResource function's include section and add program/subject
const targetSection = `        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        class: {`;

const replacement = `        updater: {
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
        class: {`;

// Find the updateResource function's data section to add program/subject updates
const dataTarget = `    if (updateData.classId !== undefined) data.classId = updateData.classId;`;
const dataReplacement = `    if (updateData.programId !== undefined) data.programId = updateData.programId;
    if (updateData.subjectId !== undefined) data.subjectId = updateData.subjectId;
    if (updateData.classId !== undefined) data.classId = updateData.classId;`;

// Replace in updateResource function
const updateResourceStart = content.indexOf('export const updateResource');
const updateResourceEnd = content.indexOf('export const deleteResource');
const updateResourceSection = content.substring(updateResourceStart, updateResourceEnd);

// Replace include section
const updatedIncludeSection = updateResourceSection.replace(targetSection, replacement);
// Replace data section
const finalUpdatedSection = updatedIncludeSection.replace(dataTarget, dataReplacement);

// Rebuild the full content
const newContent = content.substring(0, updateResourceStart) + 
                   finalUpdatedSection + 
                   content.substring(updateResourceEnd);

// Write back to file
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Updated resources-postgres.js to include program and subject in updateResource');
