// Browser-based migration script
// Copy and paste this into your browser console when logged in as admin

// This script will add reference IDs to all students who don't have them

console.log('🚀 Starting browser-based reference ID migration...');

async function addReferenceIdsInBrowser() {
  try {
    // Get Firebase from your app (assuming it's available globally)
    const { db } = window.firebase || {};
    if (!db) {
      console.error('❌ Firebase not found. Make sure you run this on your app page.');
      return;
    }

    const { collection, getDocs, doc, updateDoc, query, where, writeBatch } = window.firebase.firestore;

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
        const generateReferenceId = (uid) => {
          const suffix = uid.slice(-6).toUpperCase();
          return `STU-${suffix}`;
        };

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

// Run the migration
addReferenceIdsInBrowser();
