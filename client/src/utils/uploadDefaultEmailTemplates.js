/**
 * Script to upload default email templates to Firestore
 * Run this in the browser console to populate the emailTemplates collection
 */

async function uploadDefaultEmailTemplates() {
  try {
    // Import required modules
    const { defaultTemplates } = await import('./utils/defaultEmailTemplates.js');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('./services/other/config');
    
    let uploaded = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const template of defaultTemplates) {
      try {
        // Prepare template data for Firestore
        const templateData = {
          id: template.id,
          name: template.name,
          type: template.type,
          subject: template.subject,
          html: template.html,
          text: template.text || '',
          variables: template.variables || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Create document in Firestore
        const docRef = await addDoc(collection(db, 'emailTemplates'), templateData);
        uploaded++;
        
      } catch (error) {
        if (error.message.includes('Permission denied')) {
          skipped++;
        } else {
          console.error(`❌ Error uploading ${template.id}:`, error);
          errors++;
        }
      }
    }
    
    if (uploaded > 0) {
      // Templates uploaded successfully
    }
    
    return { uploaded, skipped, errors };
    
  } catch (error) {
    return { uploaded: 0, skipped: 0, errors: 1 };
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.uploadDefaultEmailTemplates = uploadDefaultEmailTemplates;
}

export default uploadDefaultEmailTemplates;
