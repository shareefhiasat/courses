// Migration script using client Firebase config
// Run from project root: node migration-client.js

// Import Firebase from client directory
const { initializeApp } = require('./client/node_modules/firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where, writeBatch } = require('./client/node_modules/firebase/firestore');

// Use your existing Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD9taKFsiHD16IqiOq8g22LKOkiH1Ak-7k",
  authDomain: "main-one-32026.firebaseapp.com",
  projectId: "main-one-32026",
  storageBucket: "main-one-32026.firebasestorage.app",
  messagingSenderId: "86442250402",
  appId: "1:86442250402:web:cbec3a98961b28846ac7fb",
  measurementId: "G-DH7SMX0GRH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Generate reference ID in STU-XXXXXX format
 */
const generateReferenceId = (uid) => {
  const suffix = uid.slice(-6).toUpperCase();
  return `STU-${suffix}`;
};

/**
 * Add reference IDs to all students
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
        // Skip if already has valid reference ID
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
    console.error('Error details:', error.code, error.message);
  }
}

// Run it
addReferenceIds();
