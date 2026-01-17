// Simple migration script - just copy this to your project root and run
// Make sure you have firebase/firestore installed: npm install firebase

// Import your existing Firebase config
const { db } = require('./client/src/firebase/config');
const { collection, getDocs, doc, updateDoc, query, where, writeBatch } = require('firebase/firestore');

/**
 * Generate reference ID in STU-XXXXXX format
 * This is the standard format used throughout the system
 */
const generateReferenceId = (uid) => {
  const suffix = uid.slice(-6).toUpperCase();
  return `STU-${suffix}`;
};

/**
 * Add reference IDs to all students who don't have them
 */
async function addReferenceIds() {
  console.log('🚀 Starting reference ID migration...');
  
  try {
    // Get all students
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);
    
    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({
        uid: doc.id,
        docRef: doc.ref,
        ...doc.data()
      });
    });
    
    console.log(`📊 Found ${students.length} students`);
    
    let processed = 0;
    let skipped = 0;
    
    // Process in batches
    const batchSize = 500;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchStudents = students.slice(i, i + batchSize);
      
      for (const student of batchStudents) {
        // Skip if already has reference ID
        if (student.referenceId && student.referenceId.startsWith('STU-')) {
          console.log(`⏭️  Skipping ${student.email || student.uid} - has ref: ${student.referenceId}`);
          skipped++;
          continue;
        }
        
        // Generate new reference ID
        const referenceId = generateReferenceId(student.uid);
        
        // Update student
        batch.update(student.docRef, {
          referenceId: referenceId,
          qrGeneratedAt: new Date()
        });
        
        console.log(`✅ ${student.email || student.uid} -> ${referenceId}`);
        processed++;
      }
      
      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed`);
    }
    
    console.log('\n🎉 Migration Complete!');
    console.log(`✅ Processed: ${processed} students`);
    console.log(`⏭️  Skipped: ${skipped} students`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run it
addReferenceIds();
