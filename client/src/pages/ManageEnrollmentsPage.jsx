import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { Container, Card, CardBody, Button, Input, Spinner, Badge, EmptyState, useToast } from '../components/ui';
import { UserX, UserCheck, Search, Shield, AlertCircle } from 'lucide-react';
import styles from './ManageEnrollmentsPage.module.css';

const ManageEnrollmentsPage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(data);
    } catch (e) {
      console.error('[ManageEnrollments] Error loading classes:', e);
    }
  };

  const loadStudents = async (classId) => {
    setLoading(true);
    try {
      // Get class document to check disabledStudents
      const classDoc = await getDoc(doc(db, 'classes', classId));
      const classData = classDoc.exists() ? classDoc.data() : {};
      const disabledStudents = classData.disabledStudents || [];

      // Get all users
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter students enrolled in this class
      const enrolledStudents = allUsers.filter(u => {
        const enrolledClasses = u.enrolledClasses || [];
        return enrolledClasses.includes(classId);
      });

      // Add disabled status
      const studentsWithStatus = enrolledStudents.map(s => ({
        ...s,
        isDisabled: disabledStudents.includes(s.id)
      }));

      setStudents(studentsWithStatus);
    } catch (e) {
      console.error('[ManageEnrollments] Error loading students:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentAccess = async (studentId, currentlyDisabled) => {
    if (!selectedClass) return;
    try {
      const classRef = doc(db, 'classes', selectedClass.id);
      if (currentlyDisabled) {
        // Enable access - remove from disabledStudents array
        await updateDoc(classRef, {
          disabledStudents: arrayRemove(studentId)
        });
      } else {
        // Disable access - add to disabledStudents array
        await updateDoc(classRef, {
          disabledStudents: arrayUnion(studentId)
        });
      }
      // Reload students
      await loadStudents(selectedClass.id);
    } catch (e) {
      console.error('[ManageEnrollments] Error toggling access:', e);
      toast.error('Failed to update: ' + (e?.message || 'unknown error'));
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.displayName || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.id || '').toLowerCase().includes(term)
    );
  });

  if (!isAdmin && !isInstructor) {
    return (
      <Container maxWidth="md" className={styles.accessDenied}>
        <Shield size={48} className={styles.accessDeniedIcon} />
        <h2>Access Denied</h2>
        <p>This page is only accessible to instructors and admins.</p>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className={styles.page}>
      <div className={styles.header}>
        <Shield size={28} />
        <h1>{t('manage_enrollments') || 'Manage Student Access'}</h1>
      </div>

      <div className={styles.layout}>
        {/* Class List */}
        <Card className={styles.classList}>
          <CardBody>
            <div className={styles.classListHeader}>{t('classes') || 'Classes'} ({classes.length})</div>
            <div className={styles.classItems}>
            {classes.map((cls, idx) => {
              const isSelected = selectedClass?.id === cls.id;
              const uniqueKey = cls.id || `class-${idx}`;
              return (
                <div
                  key={uniqueKey}
                  onClick={() => { 
                    if (cls.id) {
                      setSelectedClass(cls); 
                      loadStudents(cls.id);
                    }
                  }}
                  className={`${styles.classItem} ${isSelected ? styles.classItemSelected : ''}`}
                >
                  <div className={styles.className}>{cls.name || cls.code}</div>
                  <div className={styles.classInfo}>
                    {cls.term && `${cls.term}`} {cls.year && `• ${cls.year}`}
                  </div>
                </div>
              );
            })}
            </div>
          </CardBody>
        </Card>

        {/* Students List */}
        <Card className={styles.studentsPanel}>
          <CardBody>
          {!selectedClass ? (
            <EmptyState
              icon={Search}
              title={t('select_class') || 'Select a class to manage student access'}
            />
          ) : (
            <>
              <div className={styles.selectedClassHeader}>
                <h2>{selectedClass.name || selectedClass.code}</h2>
                <div className={styles.stats}>
                  {t('total_students') || 'Total Students'}: {students.length}
                  {' • '}
                  {t('disabled') || 'Disabled'}: {students.filter(s => s.isDisabled).length}
                </div>
              </div>

              {/* Search */}
              <Input
                type="text"
                placeholder={t('search_students') || 'Search students...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={16} />}
                className={styles.searchInput}
              />

              {/* Info Box */}
              <div className={styles.infoBox}>
                <AlertCircle size={16} />
                <div>
                  <strong>Info:</strong> Disabling a student prevents them from:
                  <ul>
                    <li>Accessing class chat</li>
                    <li>Viewing class activities</li>
                    <li>Submitting assignments</li>
                    <li>Scanning attendance (if implemented)</li>
                  </ul>
                  You can re-enable access anytime.
                </div>
              </div>

              {/* Students Table */}
              {loading ? (
                <div className={styles.loadingState}>
                  <Spinner size="lg" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={searchTerm ? (t('no_students_found') || 'No students found') : (t('no_students_enrolled') || 'No students enrolled in this class')}
                />
              ) : (
                <div className={styles.studentsList}>
                  {filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className={`${styles.studentItem} ${student.isDisabled ? styles.studentDisabled : ''}`}
                    >
                      <div className={styles.studentInfo}>
                        <div className={styles.studentName}>
                          {student.displayName || student.email}
                          {student.isDisabled && (
                            <Badge variant="danger" size="sm">DISABLED</Badge>
                          )}
                        </div>
                        <div className={styles.studentEmail}>
                          {student.email}
                        </div>
                        <div className={styles.studentId}>
                          ID: {student.id}
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleStudentAccess(student.id, student.isDisabled)}
                        variant={student.isDisabled ? 'success' : 'danger'}
                        size="sm"
                        icon={student.isDisabled ? <UserCheck size={16} /> : <UserX size={16} />}
                      >
                        {student.isDisabled ? (t('enable') || 'Enable') : (t('disable') || 'Disable')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default ManageEnrollmentsPage;
