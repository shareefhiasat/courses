import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import { 
  getSubjects as getSubjectsFromDb,
  getSubject as getSubjectFromDb,
  createSubject as createSubjectToDb,
  updateSubject as updateSubjectInDb,
  deleteSubject as deleteSubjectFromDb,
  getSubjectsByProgram as getSubjectsByProgramFromDb,
  getActiveSubjects as getActiveSubjectsFromDb,
  searchSubjects as searchSubjectsFromDb
} from '../db/subjectDbService';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

/**
 * Subjects Collection - Academic subjects within programs
 */
export const getSubjects = withPerformanceMonitoring(
  memoize(async () => {
    try {
      return await getSubjectsFromDb();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }),
  'getSubjects'
);

export const getSubject = withPerformanceMonitoring(
  memoize(async (subjectId) => {
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
  }),
  'getSubject'
);

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
    const subjectData = {
      ...data,
      updatedAt: Timestamp.now()
    };
    await updateDoc(doc(db, 'subjects', subjectId), subjectData);
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

export const getSubjectsByProgram = async (programId) => {
  try {
    const q = query(
      collection(db, 'subjects'), 
      where('programId', '==', programId),
      orderBy('name_en', 'asc')
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

