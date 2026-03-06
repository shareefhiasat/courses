// MongoDB Import Script - Convert Firestore JSON to MongoDB
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function importFirestoreData() {
  const uri = 'mongodb://admin:admin123@mongodb:27017/lms_dev?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('lms_dev');

    // Path to the Firestore backup file
    const backupFile = path.join(__dirname, 'backups', 'merged_firestore_data.json');

    if (!fs.existsSync(backupFile)) {
      console.log('Backup file not found:', backupFile);
      return;
    }

    const rawData = fs.readFileSync(backupFile, 'utf8');
    const firestoreData = JSON.parse(rawData);

    console.log('Importing Firestore collections to MongoDB...');

    // Map Firestore collections to MongoDB collections
    const collectionMappings = {
      // Your Firebase collections (adjust these based on your actual data)
      'users': 'users',
      'classes': 'classes',
      'courses': 'courses',
      'subjects': 'subjects',
      'programs': 'programs',
      'activities': 'activities',
      'resources': 'resources',
      'attendance': 'attendance',
      'enrollments': 'enrollments',
      'announcements': 'announcements',
      'notifications': 'notifications',
      'quizzes': 'quizzes',
      'questions': 'questions',
      'quizSubmissions': 'quizSubmissions',
      'files': 'files',
      'categories': 'categories',
      'behaviors': 'behaviors',
      'penalties': 'penalties',
      'activities': 'activities',
      'activityLogs': 'activityLogs',
      'notificationLogs': 'notificationLogs',
      'emailTemplates': 'emailTemplates',
      'emails': 'emails',
      'directRooms': 'directRooms'
    };

    for (const [firestoreCollection, mongoCollection] of Object.entries(collectionMappings)) {
      if (firestoreData[firestoreCollection]) {
        const collection = db.collection(mongoCollection);

        // Convert Firestore format to MongoDB format
        const documents = Object.entries(firestoreData[firestoreCollection]).map(([docId, docData]) => {
          // Add MongoDB _id field
          return {
            _id: docId,
            ...docData
          };
        });

        if (documents.length > 0) {
          // Clear existing data
          await collection.deleteMany({});

          // Insert new data
          const result = await collection.insertMany(documents);
          console.log(`✅ Imported ${result.insertedCount} documents into ${mongoCollection}`);
        } else {
          console.log(`ℹ️  No documents to import for ${mongoCollection}`);
        }
      }
    }

    // Create indexes for better performance (matching your mongo-init.js)
    console.log('Creating database indexes...');

    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ studentNumber: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ status: 1 });
    await db.collection('users').createIndex({ enrolledClasses: 1 });

    // Classes indexes
    await db.collection('classes').createIndex({ code: 1 }, { unique: true });
    await db.collection('classes').createIndex({ instructorId: 1 });
    await db.collection('classes').createIndex({ subjectId: 1 });
    await db.collection('classes').createIndex({ programId: 1 });

    // Courses indexes
    await db.collection('courses').createIndex({ code: 1 }, { unique: true });
    await db.collection('courses').createIndex({ programId: 1 });

    // Subjects indexes
    await db.collection('subjects').createIndex({ code: 1 }, { unique: true });
    await db.collection('subjects').createIndex({ courseId: 1 });

    // Enrollments indexes
    await db.collection('enrollments').createIndex({ studentId: 1, classId: 1 }, { unique: true });
    await db.collection('enrollments').createIndex({ studentId: 1 });
    await db.collection('enrollments').createIndex({ classId: 1 });

    // Attendance indexes
    await db.collection('attendance').createIndex({ studentId: 1, classId: 1, date: 1 }, { unique: true });
    await db.collection('attendance').createIndex({ studentId: 1 });
    await db.collection('attendance').createIndex({ classId: 1 });
    await db.collection('attendance').createIndex({ date: 1 });

    // Other indexes
    await db.collection('quizzes').createIndex({ classId: 1 });
    await db.collection('quizzes').createIndex({ createdBy: 1 });
    await db.collection('questions').createIndex({ quizId: 1 });
    await db.collection('quizSubmissions').createIndex({ quizId: 1, studentId: 1 }, { unique: true });
    await db.collection('quizSubmissions').createIndex({ studentId: 1 });
    await db.collection('resources').createIndex({ classId: 1 });
    await db.collection('resources').createIndex({ createdBy: 1 });
    await db.collection('resources').createIndex({ tags: 1 });
    await db.collection('notifications').createIndex({ userId: 1 });
    await db.collection('notifications').createIndex({ isRead: 1 });
    await db.collection('notifications').createIndex({ expiresAt: 1 });
    await db.collection('activities').createIndex({ userId: 1 });
    await db.collection('activities').createIndex({ timestamp: 1 });
    await db.collection('activityLogs').createIndex({ userId: 1 });
    await db.collection('activityLogs').createIndex({ timestamp: 1 });
    await db.collection('announcements').createIndex({ classId: 1 });
    await db.collection('announcements').createIndex({ programId: 1 });
    await db.collection('announcements').createIndex({ createdBy: 1 });

    console.log('✅ Database indexes created');
    console.log('✅ Firestore data import completed successfully!');

  } catch (error) {
    console.error('❌ Error importing data:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the import
importFirestoreData().catch(console.error);
