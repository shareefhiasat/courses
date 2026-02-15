/**
 * Script to upload default email templates to Firestore
 * Run this in the browser console to populate the emailTemplates collection
 */

async function uploadDefaultEmailTemplates() {
  console.log('🚀 Starting upload of default email templates...');
  
  try {
    // Import required modules
    const { defaultTemplates } = await import('./utils/defaultEmailTemplates.js');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('./services/other/config');
    
    console.log('📋 Found', defaultTemplates.length, 'default templates');
    
    let uploaded = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const template of defaultTemplates) {
      try {
        console.log(`📤 Uploading template: ${template.id} (${template.name})`);
        
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
        console.log(`✅ Uploaded ${template.id} with ID: ${docRef.id}`);
        uploaded++;
        
      } catch (error) {
        if (error.message.includes('Permission denied')) {
          console.warn(`⚠️ Skipped ${template.id} - permission denied (may already exist)`);
          skipped++;
        } else {
          console.error(`❌ Error uploading ${template.id}:`, error);
          errors++;
        }
      }
    }
    
    console.log('📊 Upload Summary:');
    console.log(`✅ Uploaded: ${uploaded}`);
    console.log(`⚠️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${defaultTemplates.length}`);
    
    if (uploaded > 0) {
      console.log('🎉 Templates uploaded successfully! Try sending QR email again.');
    }
    
    return { uploaded, skipped, errors };
    
  } catch (error) {
    console.error('❌ Upload script error:', error);
    return { uploaded: 0, skipped: 0, errors: 1 };
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.uploadDefaultEmailTemplates = uploadDefaultEmailTemplates;
  console.log('🔧 Upload function available: window.uploadDefaultEmailTemplates()');
}

export default uploadDefaultEmailTemplates;
