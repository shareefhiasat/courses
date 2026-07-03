const fs = require('fs');

// Read the file
const filePath = './backend/db/resources-postgres.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find the createResource function's include section and add program/subject
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

// Replace only in the createResource function (first occurrence)
const createResourceStart = content.indexOf('export const createResource');
const createResourceEnd = content.indexOf('export const updateResource');
const createResourceSection = content.substring(createResourceStart, createResourceEnd);

// Replace in this section
const updatedSection = createResourceSection.replace(targetSection, replacement);

// Rebuild the full content
const newContent = content.substring(0, createResourceStart) + 
                   updatedSection + 
                   content.substring(createResourceEnd);

// Write back to file
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Updated resources-postgres.js to include program and subject in createResource');
