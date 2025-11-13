import React, { useEffect, useState, useMemo } from 'react';
import { Globe2, Code2, Monitor, Sigma, BookOpen, BarChart3, Megaphone, Link2, MessageSquareText, RotateCcw, FileText, AlertCircle } from 'lucide-react';
import { getActivities, getAnnouncements, getCourses } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLang } from '../contexts/LangContext';
import { formatDateTime } from '../utils/date';
import Loading from '../components/Loading';
import AuthForm from '../components/AuthForm';
import RankDisplay from '../components/RankDisplay';
import RecentMedals from '../components/RecentMedals';
import './HomePage.css';

const HomePage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(''); // Default to "ALL" (empty string)
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const { lang, t } = useLang();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});
  const [annCollapsed, setAnnCollapsed] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    console.log('[Home] authLoading:', authLoading, 'user:', !!user, 'uid:', user?.uid);
    if (authLoading) return;
    if (!user) {
      // Avoid querying protected collections when not signed in
      console.log('[Home] No user, skipping data loads');
      setActivities([]);
      setAnnouncements([]);
      setCourses([]);
      return;
    }
    loadData();
  }, [authLoading, user]);

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) return;
      try {
        console.log('[Home] Fetching user enrollments for', user.uid);
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        setEnrolledClasses(Array.isArray(data.enrolledClasses) ? data.enrolledClasses : []);
        setUserData(data);
      } catch (e) {
        if (e?.code === 'permission-denied') {
          console.warn('[Home] permission-denied reading users/', user.uid);
        } else {
          console.error('[Home] enrollments error:', e);
        }
      }
    };
    loadEnrollments();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('[Home] Loading activities/announcements/courses...');
      const [activitiesResult, announcementsResult, coursesResult] = await Promise.all([
        getActivities(),
        getAnnouncements(),
        getCourses()
      ]);
      
      if (activitiesResult.success) {
        setActivities(activitiesResult.data);
        console.log('[Home] activities count:', activitiesResult.data?.length || 0);
      } else if (activitiesResult.error) {
        console.warn('[Home] activities error:', activitiesResult.error);
      }
      if (announcementsResult.success) {
        setAnnouncements(announcementsResult.data);
        console.log('[Home] announcements count:', announcementsResult.data?.length || 0);
      } else if (announcementsResult.error) {
        console.warn('[Home] announcements error:', announcementsResult.error);
      }
      if (coursesResult.success) {
        const list = coursesResult.data || [];
        setCourses(list);
        console.log('[Home] courses count:', list.length);
      } else if (coursesResult.error) {
        console.warn('[Home] courses error:', coursesResult.error);
      }
    } catch (error) {
      if (error?.code === 'permission-denied') {
        console.warn('[Home] permission-denied in loadData()');
      } else {
        console.error('Error loading data:', error);
      }
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
        <>
          {/* Military Rank Display for Students */}
          <div style={{ marginBottom: '1rem' }}>
            <RankDisplay 
              totalPoints={userData?.totalPoints || 0}
              studentName={userData?.displayName || user?.displayName || user?.email}
              showProgress={true}
            />
          </div>
          
          {/* Dashboard Grid */}
          <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
            {/* Recent Medals */}
            <RecentMedals studentId={user?.uid} limit={5} />
            
            {/* Stats Card - Activities Progress */}
            <div className="stats-card">
              <div className="stats-card-header">
                <span className="stats-card-icon"><BarChart3 size={16} /></span>
                <span>{t('your_progress') || 'Your Progress'}</span>
              </div>
              <div className="stats-card-value">
                {activities.filter(a => a.show !== false && (!a.classId || enrolledClasses.includes(a.classId))).length}
              </div>
              <div className="stats-card-label">{t('total_activities') || 'Total Activities'}</div>
            </div>
          </div>
        </>
      )}
      
      {!isAdmin && (
      <div className="hero-section" style={{ marginTop: '2rem' }}>
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
          margin: '1.25rem auto',
          maxWidth: '1200px',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:'0.5rem' }}>
            <h3 style={{ margin: 0, color: '#800020', display:'flex', alignItems:'center', gap:8, fontSize: '1rem' }}><Megaphone size={16} /> {lang==='ar' ? 'الإعلانات' : 'Announcements'}</h3>
            <button
              onClick={()=>setAnnCollapsed(v=>!v)}
              style={{ padding:'4px 10px', border:'1px solid transparent', borderRadius:8, background:'#800020', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}
            >{annCollapsed ? (lang==='en'?'Show':'عرض') : (lang==='en'?'Hide':'إخفاء')}</button>
          </div>
          {!annCollapsed && (
          <>
          {/* Date Filters */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All' },
              { key: '3days', label: lang === 'en' ? 'Last 3 Days' : 'آخر 3 أيام' },
              { key: '7days', label: lang === 'en' ? 'Last 7 Days' : 'آخر 7 أيام' },
              { key: '30days', label: lang === 'en' ? 'Last 30 Days' : 'آخر 30 يوم' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setAnnouncementFilter(filter.key)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: announcementFilter === filter.key ? '#800020' : '#f0f0f0',
                  color: announcementFilter === filter.key ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: announcementFilter === filter.key ? '600' : '500',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredAnnouncements.map(announcement => {
              const announcementId = announcement.docId || announcement.id;
              const content = lang === 'ar' && announcement.content_ar ? announcement.content_ar : announcement.content;
              const isLong = content && content.length > 200;
              const expanded = expandedAnnouncements[announcementId] || false;
              
              return (
                <div key={announcementId} style={{
                  padding: '0.75rem',
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
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Link2 size={14} /> Link: {announcement.link}</span>
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
                      {announcement.createdAt ? formatDateTime(announcement.createdAt) : ''}
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
          </>)
          }
        </div>
      )}

      <div className="content-section">
        <div className="tabs">
          {/* All Tab */}
          <button
            className={`tab-btn ${activeTab === '' ? 'active' : ''}`}
            onClick={() => setActiveTab('')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            title={lang==='en' ? 'All' : 'الكل'}
          >
            <Globe2 size={16} />
            <span>{lang==='en' ? 'All' : 'الكل'} ({activities.length})</span>
          </button>
          
          {/* Category Tabs */}
          {(courses.length ? courses : [
            { docId: 'programming', name_en: 'Programming', name_ar: 'البرمجة' },
            { docId: 'computing', name_en: 'Computing', name_ar: 'الحوسبة' },
            { docId: 'algorithm', name_en: 'Algorithm', name_ar: 'الخوارزميات' },
            { docId: 'general', name_en: 'General', name_ar: 'عام' }
          ]).map(c => {
            const categoryActivities = activities.filter(a => a.course === c.docId);
            const Icon = c.docId === 'programming' ? Code2
              : c.docId === 'computing' ? Monitor
              : c.docId === 'algorithm' ? Sigma
              : BookOpen;
            return (
              <button
                key={c.docId}
                className={`tab-btn ${activeTab === c.docId ? 'active' : ''}`}
                onClick={() => setActiveTab(c.docId)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                title={lang==='ar' ? (c.name_ar || c.name_en || c.docId) : (c.name_en || c.docId)}
              >
                <Icon size={16} />
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
                  <strong style={{ marginRight: '0.5rem', color: '#800020', display:'inline-flex', alignItems:'center' }}><MessageSquareText size={14} /></strong>
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
                        {type === 'all' ? (lang==='ar' ? 'الكل' : 'All') : typeLabels[lang][type]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <strong style={{ marginRight: '0.5rem', color: '#800020', display:'inline-flex', alignItems:'center' }}><BarChart3 size={14} /></strong>
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
                        {level === 'all' ? (lang==='ar' ? 'الكل' : 'All') : difficultyLabels[lang][level]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="activities-grid">
                {loading ? (
                  <Loading message="Loading activities..." />
                ) : (
                  filterActivities(currentCourseActivities).map(activity => (
                    <div key={activity.docId || activity.id} className="activity-card">
                      <h3>{activity.title_en}</h3>
                      <p>{activity.description_en}</p>
                      <div className="activity-meta">
                        <span className={`difficulty ${activity.difficulty}`}>
                          {activity.difficulty}
                        </span>
                        <span className="activity-type">{activity.type}</span>
                      </div>
                      
                      {/* Activity Status Badges */}
                      <div className="activity-badges" style={{ 
                        display: 'flex', 
                        gap: '6px', 
                        margin: '0.75rem 0', 
                        flexWrap: 'wrap' 
                      }}>
                        {activity.allowRetake && (
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              background: '#10b981',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                            title="Retakes allowed"
                          >
                            <RotateCcw size={12} />
                            {lang === 'ar' ? 'إعادة' : 'Retake'}
                          </span>
                        )}
                        
                        {activity.requiresSubmission && (
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              background: '#3b82f6',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                            title="Requires submission"
                          >
                            <FileText size={12} />
                            {lang === 'ar' ? 'تسليم' : 'Submit'}
                          </span>
                        )}
                        
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: activity.optional === true ? '#f59e0b' : '#ef4444',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                          title={activity.optional === true ? 'Optional activity' : 'Required activity'}
                        >
                          {activity.optional === true ? (
                            <>
                              <AlertCircle size={12} />
                              {lang === 'ar' ? 'اختياري' : 'Optional'}
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} />
                              {lang === 'ar' ? 'إلزامي' : 'Required'}
                            </>
                          )}
                        </span>
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
