import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getUserStatusSummary } from './userStatus';

/**
 * Load students for a specific class with status + enrollment metadata.
 * Designed for dropdown usage (HR Penalties, Participation, Behavior, etc.).
 */
export const fetchClassStudentsWithStatus = async (classId) => {
  if (!classId) return [];

  const enrollmentsSnap = await getDocs(query(
    collection(db, 'enrollments'),
    where('classId', '==', classId)
  ));

  const studentEnrollments = enrollmentsSnap.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    .filter(enrollment => {
      const role = enrollment.role?.toLowerCase?.();
      return !role || role === 'student';
    });

  const uniqueStudentIds = Array.from(
    new Set(studentEnrollments.map(enrollment => enrollment.userId).filter(Boolean))
  );

  const students = await Promise.all(uniqueStudentIds.map(async (studentId) => {
    try {
      const studentDoc = await getDoc(doc(db, 'users', studentId));
      if (!studentDoc.exists()) return null;
      const studentData = studentDoc.data();

      const allEnrollmentsSnap = await getDocs(query(
        collection(db, 'enrollments'),
        where('userId', '==', studentId)
      ));
      const allEnrollments = allEnrollmentsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      const statusSummary = getUserStatusSummary(studentData, allEnrollments);

      return {
        id: studentId,
        docId: studentId,
        email: studentData.email,
        displayName: studentData.displayName || studentData.name || studentData.email || 'Unknown',
        status: statusSummary.status,
        statusLabel: statusSummary.label,
        enrollmentCount: statusSummary.enrollmentCount,
        statusSummary,
        userData: studentData
      };
    } catch (error) {
      console.warn('[studentSelect] Failed to load student metadata', studentId, error);
      return null;
    }
  }));

  return students.filter(Boolean).sort((a, b) => {
    const aName = a.displayName?.toLowerCase?.() || '';
    const bName = b.displayName?.toLowerCase?.() || '';
    return aName.localeCompare(bName);
  });
};

export const buildStudentOptionMeta = (student) => {
  if (!student) {
    return {
      displayLabel: '',
      searchText: ''
    };
  }

  const displayLabel = student.displayName || student.email || 'Unknown';
  const searchSegments = [
    student.displayName,
    student.email,
    student.statusLabel,
    student.status,
    typeof student.enrollmentCount === 'number' ? `${student.enrollmentCount} enrollments` : ''
  ].filter(Boolean);

  return {
    displayLabel,
    searchText: searchSegments.join(' ').toLowerCase()
  };
};
