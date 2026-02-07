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
import { db } from './config';

/**
 * Subjects Collection
 * Academic subjects within programs
 */
export const getSubjects = async () => {
  try {
    const q = query(collection(db, 'subjects'), orderBy('name_en', 'asc'));
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
