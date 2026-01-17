import { doc, getDoc, getDocs, collection, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateReferenceId, validateReferenceId } from '../utils/qrCode';

/**
 * Seed reference IDs for all existing students in the database
 * This is a one-time migration script
 */
export const seedStudentReferenceIds = async (progressCallback = null) => {
  try {
    console.log('Starting reference ID seeding for existing students...');
    
    // Get all users with role 'student'
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const students = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role === 'student') {
        students.push({
          uid: doc.id,
          docRef: doc.ref,
          ...userData
        });
      }
    });
    
    console.log(`Found ${students.length} students to process`);
    
    if (students.length === 0) {
      return { success: true, processed: 0, skipped: 0, errors: [] };
    }
    
    // Process students in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    let processed = 0;
    let skipped = 0;
    let errors = [];
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchStudents = students.slice(i, i + batchSize);
      
      for (const student of batchStudents) {
        try {
          // Check if student already has a reference ID
          if (student.referenceId) {
            if (validateReferenceId(student.referenceId)) {
              skipped++;
              continue;
            } else {
              console.warn(`Invalid reference ID for student ${student.uid}: ${student.referenceId}`);
            }
          }
          
          // Generate new reference ID
          const referenceId = generateReferenceId(student.uid);
          
          // Check for potential collisions (very rare but possible)
          const existingDoc = await getDoc(doc(db, 'users', student.uid));
          if (existingDoc.exists() && existingDoc.data().referenceId === referenceId) {
            console.warn(`Reference ID collision detected for ${student.uid}, skipping...`);
            skipped++;
            continue;
          }
          
          // Update student document
          batch.update(student.docRef, {
            referenceId,
            qrGeneratedAt: serverTimestamp(),
            qrPrintCount: 0,
            lastScannedAt: null,
            scannedBy: []
          });
          
          processed++;
          
        } catch (error) {
          console.error(`Error processing student ${student.uid}:`, error);
          errors.push({
            studentId: student.uid,
            email: student.email,
            error: error.message
          });
        }
      }
      
      // Commit batch
      try {
        await batch.commit();
        console.log(`Batch ${Math.floor(i / batchSize) + 1} committed successfully`);
        
        // Report progress
        if (progressCallback) {
          const progress = Math.min(((i + batchSize) / students.length) * 100, 100);
          progressCallback({
            progress,
            processed,
            skipped,
            errors: errors.length,
            total: students.length
          });
        }
        
      } catch (batchError) {
        console.error('Batch commit failed:', batchError);
        errors.push({
          error: `Batch commit failed: ${batchError.message}`,
          batchIndex: Math.floor(i / batchSize) + 1
        });
      }
    }
    
    console.log('Reference ID seeding completed');
    console.log(`Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors.length}`);
    
    return {
      success: true,
      processed,
      skipped,
      errors,
      total: students.length
    };
    
  } catch (error) {
    console.error('Reference ID seeding failed:', error);
    return {
      success: false,
      error: error.message,
      processed: 0,
      skipped: 0,
      errors: [error.message]
    };
  }
};

/**
 * Generate reference ID for a single student
 * @param {string} studentUid - Student's UID
 * @returns {Promise<Object>} - Result with reference ID or error
 */
export const generateStudentReferenceId = async (studentUid) => {
  try {
    if (!studentUid) {
      throw new Error('Student UID is required');
    }
    
    const studentRef = doc(db, 'users', studentUid);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    
    if (studentData.role !== 'student') {
      throw new Error('User is not a student');
    }
    
    // Check if reference ID already exists
    if (studentData.referenceId) {
      if (validateReferenceId(studentData.referenceId)) {
        return {
          success: true,
          referenceId: studentData.referenceId,
          alreadyExisted: true
        };
      } else {
        console.warn(`Invalid existing reference ID for ${studentUid}, regenerating...`);
      }
    }
    
    // Generate new reference ID
    const referenceId = generateReferenceId(studentUid);
    
    // Update student document
    await updateDoc(studentRef, {
      referenceId,
      qrGeneratedAt: serverTimestamp(),
      qrPrintCount: 0,
      lastScannedAt: null,
      scannedBy: []
    });
    
    return {
      success: true,
      referenceId,
      alreadyExisted: false
    };
    
  } catch (error) {
    console.error(`Failed to generate reference ID for ${studentUid}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Validate and fix reference IDs for all students
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Validation results
 */
export const validateAndFixReferenceIds = async (options = {}) => {
  const { fixInvalid = true, progressCallback = null } = options;
  
  try {
    console.log('Starting reference ID validation...');
    
    // Get all students
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const students = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role === 'student') {
        students.push({
          uid: doc.id,
          docRef: doc.ref,
          ...userData
        });
      }
    });
    
    console.log(`Validating ${students.length} students`);
    
    let valid = 0;
    let invalid = 0;
    let fixed = 0;
    let errors = [];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      try {
        if (!student.referenceId) {
          invalid++;
          
          if (fixInvalid) {
            const result = await generateStudentReferenceId(student.uid);
            if (result.success) {
              fixed++;
            } else {
              errors.push({
                studentId: student.uid,
                email: student.email,
                error: result.error
              });
            }
          }
        } else if (!validateReferenceId(student.referenceId)) {
          invalid++;
          
          if (fixInvalid) {
            const referenceId = generateReferenceId(student.uid);
            await updateDoc(student.docRef, {
              referenceId,
              qrGeneratedAt: serverTimestamp(),
              qrPrintCount: 0,
              lastScannedAt: null,
              scannedBy: []
            });
            fixed++;
          }
        } else {
          valid++;
        }
        
        // Report progress
        if (progressCallback) {
          const progress = ((i + 1) / students.length) * 100;
          progressCallback({
            progress,
            valid,
            invalid,
            fixed,
            errors: errors.length,
            total: students.length
          });
        }
        
      } catch (error) {
        console.error(`Error validating student ${student.uid}:`, error);
        errors.push({
          studentId: student.uid,
          email: student.email,
          error: error.message
        });
      }
    }
    
    console.log('Reference ID validation completed');
    console.log(`Valid: ${valid}, Invalid: ${invalid}, Fixed: ${fixed}, Errors: ${errors.length}`);
    
    return {
      success: true,
      valid,
      invalid,
      fixed,
      errors,
      total: students.length
    };
    
  } catch (error) {
    console.error('Reference ID validation failed:', error);
    return {
      success: false,
      error: error.message,
      valid: 0,
      invalid: 0,
      fixed: 0,
      errors: [error.message]
    };
  }
};

/**
 * Get reference ID statistics
 * @returns {Promise<Object>} - Statistics about reference IDs
 */
export const getReferenceIdStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    let totalStudents = 0;
    let withReferenceId = 0;
    let withoutReferenceId = 0;
    let withValidFormat = 0;
    let withInvalidFormat = 0;
    let withQrGenerated = 0;
    let recentlyGenerated = 0; // Generated in last 30 days
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      
      if (userData.role === 'student') {
        totalStudents++;
        
        if (userData.referenceId) {
          withReferenceId++;
          
          if (validateReferenceId(userData.referenceId)) {
            withValidFormat++;
          } else {
            withInvalidFormat++;
          }
          
          if (userData.qrGeneratedAt) {
            withQrGenerated++;
            
            const generatedDate = userData.qrGeneratedAt.toDate();
            if (generatedDate > thirtyDaysAgo) {
              recentlyGenerated++;
            }
          }
        } else {
          withoutReferenceId++;
        }
      }
    });
    
    return {
      totalStudents,
      withReferenceId,
      withoutReferenceId,
      withValidFormat,
      withInvalidFormat,
      withQrGenerated,
      recentlyGenerated,
      coveragePercentage: totalStudents > 0 ? (withReferenceId / totalStudents * 100).toFixed(2) : 0,
      validFormatPercentage: withReferenceId > 0 ? (withValidFormat / withReferenceId * 100).toFixed(2) : 0
    };
    
  } catch (error) {
    console.error('Failed to get reference ID stats:', error);
    return {
      error: error.message
    };
  }
};

/**
 * Create QR scan record for analytics
 * @param {Object} scanData - Scan information
 * @returns {Promise<Object>} - Result of the operation
 */
export const recordQRScan = async (scanData) => {
  try {
    const {
      studentId,
      scannedBy,
      actionType = 'profile_scan',
      context = {},
      deviceInfo = {},
      location = null
    } = scanData;
    
    if (!studentId || !scannedBy) {
      throw new Error('Student ID and scanner ID are required');
    }
    
    // Create scan record
    const scanRef = doc(collection(db, 'qrScans'));
    const scanRecord = {
      studentId,
      scannedBy,
      actionType,
      context,
      deviceInfo,
      location,
      scannedAt: serverTimestamp(),
      id: scanRef.id
    };
    
    await setDoc(scanRef, scanRecord);
    
    // Update student's scan history
    const studentRef = doc(db, 'users', studentId);
    await updateDoc(studentRef, {
      lastScannedAt: serverTimestamp(),
      scannedBy: Array.isArray(context.scannedBy) ? 
        [...new Set([...context.scannedBy, scannedBy])] : 
        [scannedBy]
    });
    
    return {
      success: true,
      scanId: scanRef.id
    };
    
  } catch (error) {
    console.error('Failed to record QR scan:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get QR scan history for a student
 * @param {string} studentId - Student's UID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Scan history
 */
export const getStudentQRScanHistory = async (studentId, options = {}) => {
  try {
    const { limit = 50, startDate = null, endDate = null } = options;
    
    let constraints = [where('studentId', '==', studentId)];
    
    if (startDate) {
      constraints.push(where('scannedAt', '>=', startDate));
    }
    
    if (endDate) {
      constraints.push(where('scannedAt', '<=', endDate));
    }
    
    constraints.push(limit(limit));
    constraints.push(orderBy('scannedAt', 'desc'));
    
    const scansRef = collection(db, 'qrScans');
    const q = query(scansRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const scans = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: scans,
      total: scans.length
    };
    
  } catch (error) {
    console.error('Failed to get QR scan history:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

export default {
  seedStudentReferenceIds,
  generateStudentReferenceId,
  validateAndFixReferenceIds,
  getReferenceIdStats,
  recordQRScan,
  getStudentQRScanHistory
};
