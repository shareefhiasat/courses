import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, query, where } from 'firebase/firestore';
import { getEnrollments } from '../firebase/firestore';
import { getPrograms, getSubjects } from '../firebase/programs';
import { Container, Card, CardBody, Button, Input, Spinner, Badge, EmptyState, useToast, Select, YearSelect } from '../components/ui';
import { UserX, UserCheck, Search, Shield, AlertCircle } from 'lucide-react';
import styles from './ManageEnrollmentsPage.module.css';

const ManageEnrollmentsPage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');

  const availableYears = useMemo(() => {
    const years = new Set();
    classes.forEach(cls => {
      if (cls.year) {
        years.add(String(cls.year));
      } else if (cls.term) {
        const parts = cls.term.split(' ');
        if (parts.length > 1) {
          const yearPart = parts[parts.length - 1];
          if (yearPart && !isNaN(yearPart)) {
            years.add(yearPart);
          }
        }
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [classes]);

  const availableTerms = useMemo(() => {
    const terms = new Set();
    classes.forEach(cls => {
      if (cls.term) {
        const termPart = cls.term.split(' ')[0];
        if (termPart) terms.add(termPart);
      }
    });
    return Array.from(terms).sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    let result = [...classes];
    
    // Filter by program
    if (programFilter !== 'all') {
      result = result.filter(cls => {
        if (!cls.subjectId) return false;
        const subject = subjects.find(s => (s.docId || s.id) === cls.subjectId);
        if (!subject) return false;
        return (subject.programId || '') === programFilter;
      });
    }
    
    // Filter by subject
    if (subjectFilter !== 'all') {
      result = result.filter(cls => {
        return (cls.subjectId || '') === subjectFilter;
      });
    }
    
    // Filter by class
    if (classFilter !== 'all') {
      result = result.filter(cls => {
        const classId = cls.id || cls.docId;
        return String(classId) === String(classFilter);
      });
    }
    
    // Filter by year
    if (yearFilter !== 'all') {
      result = result.filter(cls => {
        if (cls.year && String(cls.year) === yearFilter) return true;
        if (cls.term) {
          const parts = cls.term.split(' ');
          if (parts.length > 1 && parts[parts.length - 1] === yearFilter) return true;
        }
        return false;
      });
    }
    
    // Filter by term
    if (termFilter !== 'all') {
      result = result.filter(cls => {
        if (!cls.term) return false;
        const termPart = cls.term.split(' ')[0];
        return termPart === termFilter;
      });
    }
    
    // Sort by name
    result.sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || ''));
    
    return result;
  }, [classes, programs, subjects, programFilter, subjectFilter, classFilter, yearFilter, termFilter]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesSnap, programsRes, subjectsRes] = await Promise.all([
        getDocs(collection(db, 'classes')),
        getPrograms(),
        getSubjects()
      ]);
      
      const classesData = classesSnap.docs.map(d => ({ 
        id: d.id, 
        docId: d.id,
        ...d.data() 
      }));
      setClasses(classesData);
      
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
    } catch (e) {
      console.error('[ManageEnrollments] Error loading data:', e);
    }
  };

  const loadStudents = async (classId) => {
    setLoading(true);
    try {
      // Get class document to check disabledStudents
      const classDoc = await getDoc(doc(db, 'classes', classId));
      const classData = classDoc.exists() ? classDoc.data() : {};
      const disabledStudents = classData.disabledStudents || [];

      // Get enrollments for this class
      const enrollmentsResult = await getEnrollments();
      console.log('🔍 [ManageEnrollments] All enrollments:', enrollmentsResult.data);
      const classEnrollments = (enrollmentsResult.data || []).filter(e => {
        const eClassId = e.classId || e.classDocId;
        const matchesClass = String(eClassId) === String(classId);
        const isStudentRole = e.role === 'student' || e.role === 'Student';
        console.log('🔍 [ManageEnrollments] Checking enrollment:', { 
          eClassId, 
          classId, 
          matchesClass, 
          role: e.role, 
          isStudentRole,
          enrollment: e 
        });
        return matchesClass && isStudentRole;
      });

      console.log('🔍 [ManageEnrollments] Class ID:', classId);
      console.log('🔍 [ManageEnrollments] Found enrollments:', classEnrollments.length, classEnrollments);

      // Get user IDs from enrollments
      const studentIds = classEnrollments.map(e => {
        const uid = e.userId || e.userDocId;
        console.log('🔍 [ManageEnrollments] Enrollment userId:', uid, 'from enrollment:', e);
        return uid;
      }).filter(Boolean);
      
      console.log('🔍 [ManageEnrollments] Student IDs to match:', studentIds);

      // Get all users and filter by student role and enrollment
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ docId: d.id, id: d.id, ...d.data() }));

      console.log('🔍 [ManageEnrollments] Total users loaded:', allUsers.length);
      console.log('🔍 [ManageEnrollments] ALL users details:', allUsers.map(u => ({ 
        docId: u.docId, 
        id: u.id, 
        email: u.email, 
        role: u.role,
        archived: u.archived,
        deleted: u.deleted
      })));
      console.log('🔍 [ManageEnrollments] Looking for student IDs:', studentIds);

      // Filter: must be a student AND enrolled in this class
      // IMPORTANT: Check enrollment role, not just user doc role (user might not have role set)
      const enrolledStudents = allUsers.filter(u => {
        const userId = u.docId || u.id;
        
        // Find enrollment for this user
        const enrollmentForUser = classEnrollments.find(e => {
          const eUserId = e.userId || e.userDocId;
          return String(eUserId) === String(userId);
        });
        
        // User is considered a student if:
        // 1. They have an enrollment with role 'student', OR
        // 2. Their user doc has role 'student' (fallback)
        const isStudent = enrollmentForUser ? 
          (enrollmentForUser.role === 'student' || enrollmentForUser.role === 'Student') :
          (u.role === 'student' || u.role === 'Student');
        
        console.log('🔍 [ManageEnrollments] Processing user:', {
          userId,
          email: u.email,
          userRole: u.role,
          enrollmentRole: enrollmentForUser?.role,
          isStudent,
          hasEnrollment: !!enrollmentForUser,
          docId: u.docId,
          id: u.id,
          archived: u.archived,
          deleted: u.deleted
        });
        
        // Check if user is archived or deleted - exclude them
        if (u.archived || u.deleted) {
          console.log('⚠️ [ManageEnrollments] Skipping archived/deleted user:', userId, u.email);
          return false;
        }
        
        // Try multiple matching strategies
        const isEnrolled = studentIds.some(sid => {
          // Normalize both IDs to strings for comparison
          const normalizedSid = String(sid).trim();
          const normalizedUserId = String(userId).trim();
          const match = normalizedSid === normalizedUserId;
          
          if (match) {
            console.log('✅ [ManageEnrollments] ID Match found:', { 
              enrollmentUserId: sid, 
              userDocId: userId, 
              normalizedSid, 
              normalizedUserId, 
              match 
            });
          }
          return match;
        });
        
        console.log('🔍 [ManageEnrollments] User check result:', {
          userId,
          email: u.email,
          isStudent,
          isEnrolled,
          willInclude: isStudent && isEnrolled
        });
        
        if (isStudent && isEnrolled) {
          console.log('✅ [ManageEnrollments] MATCHED STUDENT - Will include:', userId, u.email);
        } else if (isStudent && !isEnrolled) {
          console.log('❌ [ManageEnrollments] Student but NOT enrolled:', userId, u.email);
        } else if (!isStudent && isEnrolled) {
          console.log('❌ [ManageEnrollments] Enrolled but NOT a student:', userId, u.email, 'userRole:', u.role, 'enrollmentRole:', enrollmentForUser?.role);
        }
        
        return isStudent && isEnrolled;
      });
      
      console.log('🔍 [ManageEnrollments] Final enrolled students:', enrolledStudents.length, enrolledStudents.map(s => ({ id: s.docId || s.id, email: s.email, role: s.role })));

      // Add disabled status
      const studentsWithStatus = enrolledStudents.map(s => ({
        ...s,
        isDisabled: disabledStudents.includes(s.docId || s.id)
      }));

      setStudents(studentsWithStatus);
    } catch (e) {
      console.error('[ManageEnrollments] Error loading students:', e);
      toast.error('Failed to load students: ' + (e?.message || 'unknown error'));
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
    <Container maxWidth="xl" className={styles.page} style={{ padding: '1rem 0' }}>
      <div className={styles.layout}>
        {/* Class List */}
        <Card className={styles.classList}>
          <CardBody>
            <div className={styles.classListHeader}>{t('classes') || 'Classes'} ({filteredClasses.length})</div>
            
            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: '1rem' }}>
              <Select
                searchable
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Programs' },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId
                  }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Subjects' },
                  ...subjects
                    .filter(s => programFilter === 'all' || s.programId === programFilter)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`
                    }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Classes' },
                  ...classes
                    .filter(c => {
                      if (subjectFilter !== 'all' && c.subjectId !== subjectFilter) return false;
                      if (programFilter !== 'all') {
                        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                        if (!subject || subject.programId !== programFilter) return false;
                      }
                      return true;
                    })
                    .map(c => ({
                      value: c.id || c.docId,
                      label: `${c.name || c.code || 'Unnamed'}${c.code ? ` (${c.code})` : ''}`
                    }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_years') || 'All Years' },
                  ...availableYears.map(year => ({ value: year, label: year }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_terms') || 'All Terms' },
                  ...availableTerms.map(term => ({ value: term, label: term }))
                ]}
                fullWidth
              />
            </div>
            
            <div className={styles.classItems}>
            {filteredClasses.map((cls, idx) => {
              const classId = cls.id || cls.docId;
              const isSelected = (selectedClass?.id === classId) || (selectedClass?.docId === classId);
              const uniqueKey = classId || `class-${idx}`;
              return (
                <div
                  key={uniqueKey}
                  onClick={() => { 
                    if (classId) {
                      setSelectedClass({ ...cls, id: classId, docId: classId }); 
                      loadStudents(classId);
                    }
                  }}
                  className={`${styles.classItem} ${isSelected ? styles.classItemSelected : ''}`}
                  style={{ cursor: classId ? 'pointer' : 'default' }}
                >
                  <div className={styles.className}>{cls.name || cls.code || 'Unnamed Class'}</div>
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
                  <Spinner size="large" color="primary" />
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
                      </div>
                      <Button
                        onClick={() => toggleStudentAccess(student.id, student.isDisabled)}
                        variant={student.isDisabled ? 'primary' : 'danger'}
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
