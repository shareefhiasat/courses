import React, { useEffect, useState, useMemo } from 'react';
import { getActivities, getAnnouncements, getCourses } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLang } from '../contexts/LangContext';
import Loading from '../components/Loading';
import AuthForm from '../components/AuthForm';
import './HomePage.css';

const HomePage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(''); // course id
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const { lang, t } = useLang();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        setEnrolledClasses(Array.isArray(data.enrolledClasses) ? data.enrolledClasses : []);
      } catch {}
    };
    loadEnrollments();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesResult, announcementsResult, coursesResult] = await Promise.all([
        getActivities(),
        getAnnouncements(),
        getCourses()
      ]);
      
      if (activitiesResult.success) {
        setActivities(activitiesResult.data);
      }
      if (announcementsResult.success) {
        setAnnouncements(announcementsResult.data);
      }
      if (coursesResult.success) {
        const list = coursesResult.data || [];
        setCourses(list);
        if (!activeTab) setActiveTab(list[0]?.docId || 'programming');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter announcements by date - MUST BE BEFORE CONDITIONAL RETURNS
  const filteredAnnouncements = useMemo(() => {
    let filtered = announcements;
    
    if (announcementFilter !== 'all') {
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      const filterDays = {
        '3days': 3,
        '7days': 7,
        '30days': 30
      };
      
      const days = filterDays[announcementFilter];
      if (days) {
        const cutoffDate = now - (days * dayInMs);
        filtered = filtered.filter(a => {
          const date = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          return date >= cutoffDate;
        });
      }
    }
    return filtered.slice(0, 5);
  }, [announcements, announcementFilter]);

  // Filter activities by type and difficulty
  const filterActivities = (courseActivities) => {
    let filtered = courseActivities;

    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === activityTypeFilter);
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(a => a.difficulty === difficultyFilter);
    }
    // Enrollment gate: if activity.classId exists, only show when user enrolled
    filtered = filtered.filter(a => a.show !== false && (!a.classId || (enrolledClasses || []).includes(a.classId)));
    return filtered.sort((x, y) => (x.order || 0) - (y.order || 0));
  };

  const typeLabels = {
    en: { training: 'Training', homework: 'Homework', quiz: 'Quiz', all: 'All Types' },
    ar: { training: 'تدريب', homework: 'واجب', quiz: 'اختبار', all: 'كل الأنواع' }
  };
  const courseName = (courseId) => {
    const c = (courses || []).find(x => (x.docId || x.id) === courseId);
    if (!c) return courseId || '';
    return lang === 'ar' ? (c.name_ar || c.name_en || courseId) : (c.name_en || courseId);
  };

  const currentCourseActivities = activeTab === '' 
    ? activities.filter(a => a.show !== false && (!a.classId || (enrolledClasses || []).includes(a.classId)))
    : activities.filter(a => (a.course || 'general') === activeTab)
        .filter(a => a.show !== false && (!a.classId || (enrolledClasses || []).includes(a.classId)));

  const difficultyLabels = {
    en: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', all: 'All Levels' },
    ar: { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم', all: 'كل المستويات' }
  };

  // Early returns AFTER all hooks
  if (authLoading) {
    return <Loading message="Initializing..." />;
  }

  if (!user) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Learning Hub</h1>
            <p className="hero-subtitle">
              Interactive exercises and games for mastering programming concepts
            </p>
          </div>
        </div>
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="home-page">
      {!isAdmin && (
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Learning Hub</h1>
          <p className="hero-subtitle">
            Interactive exercises and games for mastering programming concepts
          </p>
        </div>
      </div>
      )}

      {announcements.length > 0 && (
        <div className="announcements-section" style={{
          background: 'white',
          margin: '2rem auto',
          maxWidth: '1200px',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#800020' }}>📢 Latest Announcements</h2>
          
          {/* Date Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: lang === 'en' ? 'All' : 'الكل' },
              { key: '3days', label: lang === 'en' ? 'Last 3 Days' : 'آخر 3 أيام' },
              { key: '7days', label: lang === 'en' ? 'Last 7 Days' : 'آخر 7 أيام' },
              { key: '30days', label: lang === 'en' ? 'Last 30 Days' : 'آخر 30 يوم' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setAnnouncementFilter(filter.key)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: announcementFilter === filter.key ? '#800020' : '#f0f0f0',
                  color: announcementFilter === filter.key ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: announcementFilter === filter.key ? '600' : '500',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredAnnouncements.map(announcement => {
              const announcementId = announcement.docId || announcement.id;
              const content = lang === 'ar' && announcement.content_ar ? announcement.content_ar : announcement.content;
              const isLong = content && content.length > 200;
              const expanded = expandedAnnouncements[announcementId] || false;
              
              return (
                <div key={announcementId} style={{
                  padding: '1rem',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  background: '#f8f9fa'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{announcement.title}</h3>
                  <p style={{ 
                    margin: '0 0 0.5rem 0', 
                    color: '#666', 
                    whiteSpace: 'pre-line', 
                    direction: lang === 'ar' ? 'rtl' : 'ltr',
                    maxHeight: isLong && !expanded ? '100px' : 'none',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {content}
                  </p>
                  {announcement.link && (
                    <div style={{ margin: '0.75rem 0' }}>
                      <a 
                        href={announcement.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          color: '#800020',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        🔗 Link: {announcement.link}
                      </a>
                    </div>
                  )}
                  {isLong && (
                    <button
                      onClick={() => setExpandedAnnouncements(prev => ({
                        ...prev,
                        [announcementId]: !prev[announcementId]
                      }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#800020',
                        cursor: 'pointer',
                        padding: '4px 0',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      {expanded ? (lang === 'en' ? '▲ Show Less' : '▲ عرض أقل') : (lang === 'en' ? '▼ Read More' : '▼ اقرأ المزيد')}
                    </button>
                  )}
                  <div>
                    <small style={{ color: '#999' }}>
                      {announcement.createdAt ? new Date(announcement.createdAt.seconds * 1000).toLocaleDateString('en-GB') : ''}
                    </small>
                  </div>
                </div>
              );
            })}
            {filteredAnnouncements.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                {lang === 'en' ? 'No announcements in this period' : 'لا توجد إعلانات في هذه الفترة'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="content-section">
        <div className="tabs">
          {/* All Tab */}
          <button
            className={`tab-btn ${activeTab === '' ? 'active' : ''}`}
            onClick={() => setActiveTab('')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
          >
            <span>🌐</span>
            <span>All ({activities.length})</span>
          </button>
          
          {/* Category Tabs */}
          {(courses.length ? courses : [
            { docId: 'programming', name_en: 'Programming', name_ar: 'البرمجة', icon: '🐍' },
            { docId: 'computing', name_en: 'Computing', name_ar: 'الحوسبة', icon: '💻' },
            { docId: 'algorithm', name_en: 'Algorithm', name_ar: 'الخوارزميات', icon: '🦊' },
            { docId: 'general', name_en: 'General', name_ar: 'عام', icon: '📚' }
          ]).map(c => {
            const categoryActivities = activities.filter(a => a.course === c.docId);
            const icon = c.icon || (c.docId === 'programming' ? '🐍' : c.docId === 'computing' ? '💻' : c.docId === 'algorithm' ? '🦊' : '📚');
            return (
              <button
                key={c.docId}
                className={`tab-btn ${activeTab === c.docId ? 'active' : ''}`}
                onClick={() => setActiveTab(c.docId)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              >
                <span>{icon}</span>
                <span>{lang==='ar' ? (c.name_ar || c.name_en || c.docId) : (c.name_en || c.docId)} ({categoryActivities.length})</span>
              </button>
            );
          })}
        </div>

        <div className="tab-content">
          {(activeTab !== null) && (
            <div className="course-content">
              <h2 className="course-title">{activeTab === '' ? (lang === 'en' ? 'All Activities' : 'جميع الأنشطة') : courseName(activeTab)}</h2>
              
              {/* Activity Filters */}
              <div style={{ marginBottom: '1.5rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ marginRight: '0.5rem', color: '#800020' }}>📋 Type</strong>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {['all', 'training', 'homework', 'quiz'].map(type => (
                      <button
                        key={type}
                        onClick={() => setActivityTypeFilter(type)}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: activityTypeFilter === type ? '#800020' : 'white',
                          color: activityTypeFilter === type ? 'white' : '#333',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: activityTypeFilter === type ? '600' : '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        {typeLabels[lang][type]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <strong style={{ marginRight: '0.5rem', color: '#800020' }}>🎯 Level</strong>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
                      <button
                        key={level}
                        onClick={() => setDifficultyFilter(level)}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: difficultyFilter === level ? '#800020' : 'white',
                          color: difficultyFilter === level ? 'white' : '#333',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: difficultyFilter === level ? '600' : '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        {difficultyLabels[lang][level]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="activities-grid">
                {loading ? (
                  <Loading message="Loading activities..." />
                ) : (
                  currentCourseActivities.map(activity => (
                    <div key={activity.docId || activity.id} className="activity-card">
                      <h3>{activity.title_en}</h3>
                      <p>{activity.description_en}</p>
                      <div className="activity-meta">
                        <span className={`difficulty ${activity.difficulty}`}>
                          {activity.difficulty}
                        </span>
                        <span className="activity-type">{activity.type}</span>
                      </div>
                      {activity.url && (
                        <a 
                          href={activity.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="activity-link"
                        >
                          Start Activity
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
