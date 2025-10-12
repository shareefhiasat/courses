import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { getClasses, getEnrollments, getUsers } from '../firebase/firestore';
import Loading from '../components/Loading';

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

  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ margin: 0, marginBottom: '1rem' }}>🎓 {t('my_classes') || 'My Classes'}</h1>
      {loading ? (
        <Loading />
      ) : myClasses.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: '1rem', color: '#666' }}>
          {t('no_classes_enrolled') || 'No classes found for your account.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {myClasses.map(cls => (
            <div key={cls.docId} style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{cls.name}</h3>
                <span style={{ fontSize: 12, color: '#666' }}>{cls.term || ''}</span>
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>{cls.code || ''}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => navigate(`/chat?dest=${encodeURIComponent(cls.docId)}`)}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: '#800020', color: 'white', cursor: 'pointer' }}
                >
                  💬 {t('open_chat') || 'Open Chat'}
                </button>
                <button
                  onClick={() => navigate('/activities')}
                  style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #800020', background: 'white', color: '#800020', cursor: 'pointer' }}
                >
                  📚 {t('view_activities') || 'View Activities'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnrollmentsPage;
