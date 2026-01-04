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
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

/**
 * Programs Collection
 * Top-level academic programs that contain subjects
 */
export const getPrograms = async () => {
  try {
    const q = query(collection(db, 'programs'), orderBy('name_en', 'asc'));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
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
        where('programId', '==', programId),
        orderBy('code', 'asc')
      );
    } else {
      q = query(collection(db, 'subjects'), orderBy('code', 'asc'));
    }
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
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

