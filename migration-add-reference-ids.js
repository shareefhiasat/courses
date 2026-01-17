// Migration script to add reference IDs to all students
// Run with: node migration-add-reference-ids.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

// Your Firebase configuration
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
 * @param {string} uid - Student's UID
 * @returns {string} - Reference ID
 */
const generateReferenceId = (uid) => {
  if (!uid || typeof uid !== 'string') {
    throw new Error('Valid UID is required to generate reference ID');
  }
  
  // Take last 6 characters and convert to uppercase
  const suffix = uid.slice(-6).toUpperCase();
  return `STU-${suffix}`;
};

/**
 * Validate reference ID format
 * @param {string} referenceId - Reference ID to validate
 * @returns {boolean} - Valid format or not
 */
const validateReferenceId = (referenceId) => {
  if (!referenceId || typeof referenceId !== 'string') {
    return false;
  }
  
  // Check format: STU-XXXXXX where X is alphanumeric
  const regex = /^STU-[A-Z0-9]{6}$/;
  return regex.test(referenceId);
};

/**
 * Main migration function
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
      const userData = doc.data();
      students.push({
        uid: doc.id,
        docRef: doc.ref,
        ...userData
      });
    });
    
    console.log(`📊 Found ${students.length} students to process`);
    
    if (students.length === 0) {
      console.log('✅ No students found. Migration complete.');
      return;
    }
    
    let processed = 0;
    let skipped = 0;
    let errors = [];
    
    // Process students in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchStudents = students.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(students.length / batchSize)}`);
      
      for (const student of batchStudents) {
        try {
          // Check if student already has a reference ID
          if (student.referenceId) {
            if (validateReferenceId(student.referenceId)) {
              console.log(`⏭️  Skipping ${student.email} - already has valid reference ID: ${student.referenceId}`);
              skipped++;
              continue;
            } else {
              console.log(`🔄 Updating ${student.email} - invalid reference ID: ${student.referenceId}`);
            }
          }
          
          // Generate new reference ID
          const referenceId = generateReferenceId(student.uid);
          
          // Update student document
          batch.update(student.docRef, {
            referenceId: referenceId,
            qrGeneratedAt: new Date()
          });
          
          console.log(`✅ Generated reference ID for ${student.email}: ${referenceId}`);
          processed++;
          
        } catch (error) {
          console.error(`❌ Error processing ${student.email}:`, error);
          errors.push({
            email: student.email,
            uid: student.uid,
            error: error.message
          });
        }
      }
      
      // Commit batch
      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} committed`);
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Processed: ${processed} students`);
    console.log(`⏭️  Skipped: ${skipped} students`);
    console.log(`❌ Errors: ${errors.length} students`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`  - ${err.email}: ${err.error}`);
      });
    }
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('🔍 Verifying migration results...');
  
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);
    
    let totalStudents = 0;
    let withReferenceId = 0;
    let withValidFormat = 0;
    let withoutReferenceId = [];
    
    querySnapshot.forEach((doc) => {
      const student = doc.data();
      totalStudents++;
      
      if (student.referenceId) {
        withReferenceId++;
        if (validateReferenceId(student.referenceId)) {
          withValidFormat++;
        }
      } else {
        withoutReferenceId.push(student.email);
      }
    });
    
    console.log('\n📊 Verification Results:');
    console.log(`👥 Total students: ${totalStudents}`);
    console.log(`✅ With reference ID: ${withReferenceId}`);
    console.log(`✅ With valid format: ${withValidFormat}`);
    console.log(`❌ Without reference ID: ${withoutReferenceId.length}`);
    
    if (withoutReferenceId.length > 0) {
      console.log('\n❌ Students without reference ID:');
      withoutReferenceId.forEach(email => {
        console.log(`  - ${email}`);
      });
    }
    
    const coveragePercentage = totalStudents > 0 ? (withReferenceId / totalStudents * 100).toFixed(2) : 0;
    const validFormatPercentage = withReferenceId > 0 ? (withValidFormat / withReferenceId * 100).toFixed(2) : 0;
    
    console.log(`\n📈 Coverage: ${coveragePercentage}%`);
    console.log(`📈 Valid format: ${validFormatPercentage}%`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the migration
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'verify') {
    verifyMigration();
  } else {
    addReferenceIds().then(() => {
      // Run verification after migration
      setTimeout(() => {
        console.log('\n' + '='.repeat(50));
        verifyMigration();
      }, 2000);
    });
  }
}

module.exports = {
  generateReferenceId,
  validateReferenceId,
  addReferenceIds,
  verifyMigration
};
