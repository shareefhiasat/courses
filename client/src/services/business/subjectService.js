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
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';

/**
 * Subjects Collection - Academic subjects within programs
 */
export const getSubjects = async () => {
  try {
    return await getSubjectsFromDb();
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

export const createSubject = async (data, user) => {
  try {
    const auditData = getCreateAuditData(user);
    const subjectData = {
      ...data,
      ...auditData
    };
    const result = await createSubjectToDb(subjectData, auditData);
    return { success: true, id: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSubject = async (subjectId, data, user) => {
  try {
    const auditData = getUpdateAuditData(user);
    const subjectData = {
      ...data,
      ...auditData
    };
    const result = await updateSubjectInDb(subjectId, subjectData, auditData);
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
      orderBy('nameEn', 'asc')
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

