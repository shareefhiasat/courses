import React, { useEffect, useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { getClasses } from '@firebaseServices/classService';
import { getEnrollments } from '@firebaseServices/enrollmentService';
import { getUsers } from '@firebaseServices/userService';
import { getUserProfile } from '@firebaseServices/userService';
import { getPrograms, getSubjects } from '@firebaseServices/programService';
import { Container, Grid, Card, CardBody, Button, Spinner, EmptyState } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './EnrollmentsPage.module.css';

const EnrollmentsPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [localClasses, setLocalClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  
  // Local state for programs and subjects (NotificationDrawer pattern)
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Load programs and subjects (NotificationDrawer pattern)
  useEffect(() => {
    const loadProgramsAndSubjects = async () => {
      try {
        const [programsRes, subjectsRes] = await Promise.all([
          getPrograms(),
          getSubjects()
        ]);
        if (programsRes.success) setPrograms(programsRes.data || []);
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      } catch (error) {
        console.error('🔍 [EnrollmentsPage] Error loading programs/subjects:', error);
      }
    };
    loadProgramsAndSubjects();
  }, []);

  // Helper function to get program name for class
  const getProgramName = (classItem) => {
    if (!classItem.subjectId) return 'N/A';
    const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
    if (!subject?.programId) return 'N/A';
    const program = programs.find(p => (p.docId || p.id) === subject.programId);
    return program?.name_en || program?.name || 'N/A';
  };

  // Helper function to get subject name for class
  const getSubjectName = (classItem) => {
    if (!classItem.subjectId) return 'N/A';
    const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
    return subject?.name_en || subject?.name || subject?.code || 'N/A';
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [clsRes, enrRes] = await Promise.all([getClasses(), getEnrollments()]);
        const cls = clsRes.success ? (clsRes.data || []) : [];
        const enr = enrRes.success ? (enrRes.data || []) : [];
        setLocalClasses(cls);
        setEnrollments(enr);
        if (user) {
          let mine = enr.filter(e => e.userId === user.uid);
          if (mine.length === 0 && user.email) {
            mine = enr.filter(e => (e.userEmail || e.email) === user.email);
          }
          let ids = new Set(mine.map(e => e.classId));
          // Fallback: read enrolledClasses array from users/{uid}
          if (ids.size === 0) {
            try {
              const me = await getUserProfile(user);
              const enrolled = Array.isArray(me?.enrolledClasses) ? me.enrolledClasses : [];
              ids = new Set(enrolled);
            } catch {}
          }
          setMyClasses(localClasses.filter(c => ids.has(c.docId)));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (authLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Container maxWidth="lg" className={styles.page}>
      <h1 className={styles.title}>🎓 {t('my_classes') || 'My Classes'}</h1>
      
      {loading ? (
        <div className={styles.loadingWrapper}>
          <Spinner size="lg" />
        </div>
      ) : myClasses.length === 0 ? (
        <EmptyState
          title={t('no_classes_enrolled') || 'No classes found'}
          description={t('not_enrolled_any_classes') || 'You are not enrolled in any classes yet.'}
        />
      ) : (
        <Grid cols={3} gap="lg" className={styles.grid}>
          {myClasses.map(cls => (
            <Card key={cls.docId} hoverable>
              <CardBody>
                <div className={styles.classHeader}>
                  <h3 className={styles.className}>{cls.name}</h3>
                  {cls.term && <span className={styles.term}>{cls.term}</span>}
                </div>
                
                {/* Show Program and Subject Information */}
                <div className={styles.classInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Program:</span>
                    <span className={styles.infoValue}>{getProgramName(cls)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Subject:</span>
                    <span className={styles.infoValue}>{getSubjectName(cls)}</span>
                  </div>
                  {cls.code && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Code:</span>
                      <span className={styles.infoValue}>{cls.code}</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={getThemedIcon('ui', 'message_circle', 16, theme)}
                    onClick={() => navigate(`/chat?dest=${encodeURIComponent(cls.docId)}`)}
                  >
                    {t('open_chat') || 'Open Chat'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={getThemedIcon('ui', 'book_open', 16, theme)}
                    onClick={() => navigate('/activities')}
                  >
                    {t('view_activities') || 'Activities'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default EnrollmentsPage;
