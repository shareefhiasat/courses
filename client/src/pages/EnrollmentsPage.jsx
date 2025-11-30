import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { getClasses, getEnrollments, getUsers } from '../firebase/firestore';
import { Container, Grid, Card, CardBody, Button, Spinner, EmptyState } from '../components/ui';
import { MessageCircle, BookOpen } from 'lucide-react';
import styles from './EnrollmentsPage.module.css';

const EnrollmentsPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [myClasses, setMyClasses] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [clsRes, enrRes] = await Promise.all([getClasses(), getEnrollments()]);
        const cls = clsRes.success ? (clsRes.data || []) : [];
        const enr = enrRes.success ? (enrRes.data || []) : [];
        setClasses(cls);
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
              const usersRes = await getUsers();
              const me = (usersRes.data || []).find(u => u.docId === user.uid || u.email === user.email);
              const enrolled = Array.isArray(me?.enrolledClasses) ? me.enrolledClasses : [];
              ids = new Set(enrolled);
            } catch {}
          }
          setMyClasses(cls.filter(c => ids.has(c.docId)));
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
          description="You are not enrolled in any classes yet."
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
                {cls.code && <div className={styles.classCode}>{cls.code}</div>}
                
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<MessageCircle size={16} />}
                    onClick={() => navigate(`/chat?dest=${encodeURIComponent(cls.docId)}`)}
                  >
                    {t('open_chat') || 'Open Chat'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<BookOpen size={16} />}
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
