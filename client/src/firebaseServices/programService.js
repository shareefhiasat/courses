import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// Re-export getClasses from classService for convenience
export { getClasses, addClass, updateClass, deleteClass, getClassById } from './classService';

/**
 * Programs Collection
 * Top-level academic programs that contain subjects
 */
export const getPrograms = async () => {
  try {
    const callId = Math.random().toString(36).substr(2, 9);
    // console.log(`🔍 [getPrograms-${callId}] Starting fetch...`);
    const q = query(collection(db, 'programs'), orderBy('name_en', 'asc'));
    // console.log(`🔍 [getPrograms-${callId}] Query created:`, q);
    const qs = await getDocs(q);
    // console.log(`🔍 [getPrograms-${callId}] Query snapshot received:`, qs);
    // console.log(`🔍 [getPrograms-${callId}] Query docs count:`, qs.docs?.length || 0);
    // console.log(`🔍 [getPrograms-${callId}] Query empty:`, qs.empty);
    // console.log(`🔍 [getPrograms-${callId}] Query metadata:`, qs.metadata);
    
    const items = [];
    qs.docs.forEach((d, index) => {
      // console.log(`🔍 [getPrograms-${callId}] Processing doc ${index}:`, {
      //   id: d.id,
      //   exists: d.exists(),
      //   data: d.data()
      // });
      const programData = { docId: d.id, ...d.data() };
      // console.log(`🔍 [getPrograms-${callId}] Program data ${index}:`, programData);
      items.push(programData);
      // console.log(`🔍 [getPrograms-${callId}] Items array length after push ${index}:`, items.length);
    });
    
    // console.log(`🔍 [getPrograms-${callId}] Final items array:`, items);
    // console.log(`🔍 [getPrograms-${callId}] Final items length:`, items.length);
    // console.log(`🔍 [getPrograms-${callId}] Returning result:`, { success: true, data: items });
    return { success: true, data: items };
  } catch (error) {
    console.error(`❌ [getPrograms-${callId}] ERROR:`, error);
    console.error(`❌ [getPrograms-${callId}] Error message:`, error.message);
    console.error(`❌ [getPrograms-${callId}] Error stack:`, error.stack);
    return { success: false, error: error.message };
  }
};

export const getProgram = async (programId) => {
  try {
    const docRef = doc(db, 'programs', programId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Program not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createProgram = async (data) => {
  try {
    const programData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, 'programs'), programData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateProgram = async (programId, data) => {
  try {
    const docRef = doc(db, 'programs', programId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteProgram = async (programId) => {
  try {
    await deleteDoc(doc(db, 'programs', programId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Subjects Collection
 * Subjects belong to programs, students enroll in subjects
 */
export const getSubjects = async (programId = null) => {
  try {
    let q;
    if (programId) {
      q = query(
        collection(db, 'subjects'),
        where('programId', '==', programId)
      );
    } else {
      q = query(collection(db, 'subjects'), orderBy('code', 'asc'));
    }
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    
    // Sort client-side when filtering by program to avoid index requirement
    if (programId) {
      items.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    }
    
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSubject = async (subjectId) => {
  try {
    const docRef = doc(db, 'subjects', subjectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Subject not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createSubject = async (data) => {
  try {
    const subjectData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, 'subjects'), subjectData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSubject = async (subjectId, data) => {
  try {
    const docRef = doc(db, 'subjects', subjectId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    await deleteDoc(doc(db, 'subjects', subjectId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Subject Enrollments
 * Track which students are enrolled in which subjects
 */
export const getSubjectEnrollments = async (subjectId = null, studentId = null) => {
  try {
    let q;
    if (subjectId && studentId) {
      q = query(
        collection(db, 'subjectEnrollments'),
        where('subjectId', '==', subjectId),
        where('studentId', '==', studentId)
      );
    } else if (subjectId) {
      q = query(collection(db, 'subjectEnrollments'), where('subjectId', '==', subjectId));
    } else if (studentId) {
      q = query(collection(db, 'subjectEnrollments'), where('studentId', '==', studentId));
    } else {
      q = query(collection(db, 'subjectEnrollments'));
    }
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const enrollStudentInSubject = async (studentId, subjectId, semester, academicYear) => {
  try {
    const enrollmentData = {
      studentId,
      subjectId,
      semester,
      academicYear,
      enrolledAt: Timestamp.now(),
      status: 'active' // 'active' | 'completed' | 'withdrawn' | 'failed'
    };
    const docRef = await addDoc(collection(db, 'subjectEnrollments'), enrollmentData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateEnrollment = async (enrollmentId, data) => {
  try {
    const docRef = doc(db, 'subjectEnrollments', enrollmentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get program by ID
export const getProgramById = async (programId) => {
  try {
    const programDoc = await getDoc(doc(db, 'programs', programId));
    if (programDoc.exists()) {
      return { success: true, data: { docId: programDoc.id, ...programDoc.data() } };
    }
    return { success: false, error: "Program not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Alias functions for consistency with other services
export const fetchProgram = getProgramById;
export const fetchSubject = getSubject;

