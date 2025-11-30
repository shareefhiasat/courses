import React, { useEffect, useState, useMemo } from 'react';
import { Globe2, Code2, Monitor, Sigma, BookOpen, BarChart3, Megaphone, Link2, MessageSquareText, RotateCcw, FileText, AlertCircle, Leaf, TrendingUp, Flame, Award, HelpCircle, ClipboardList, Play, Info, StarOff, Hourglass, Repeat, CheckCircle } from 'lucide-react';
import { getActivities, getAnnouncements, getCourses } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLang } from '../contexts/LangContext';
import { formatDateTime } from '../utils/date';
import { Container, Card, CardBody, Button, Badge, Spinner, ExpandablePanel, Loading } from '../components/ui';
import AuthForm from '../components/AuthForm';
import RankDisplay from '../components/RankDisplay';
import RecentMedals from '../components/RecentMedals';
import styles from './HomePage.module.css';
import './HomePage.css';

const HomePage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(''); // Default to "ALL" (empty string)
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [announcementSearch, setAnnouncementSearch] = useState('');
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
    // Search by title/content
    const q = (announcementSearch || '').trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(a => {
        const title = (a.title || '').toLowerCase();
        const content = ((lang === 'ar' ? (a.content_ar || a.content) : (a.content || a.content_ar)) || '').toLowerCase();
        return title.includes(q) || content.includes(q);
      });
    }
    // Sort desc by createdAt
    filtered = [...filtered].sort((a,b)=>{
      const ad = a.createdAt?.seconds ? a.createdAt.seconds*1000 : new Date(a.createdAt || 0).getTime();
      const bd = b.createdAt?.seconds ? b.createdAt.seconds*1000 : new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
    return filtered.slice(0, 20);
  }, [announcements, announcementFilter, announcementSearch, lang]);

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
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} />;
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
          <div className={styles.rankSection}>
            <RankDisplay 
              totalPoints={userData?.totalPoints || 0}
              studentName={userData?.displayName || user?.displayName || user?.email}
              showProgress={true}
            />
          </div>
          
          {/* Dashboard Grid */}
          <div className={styles.dashboardGrid}>
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
      <div className={styles.heroSection}>
        <div className="hero-content">
          <h1 className="hero-title">Learning Hub</h1>
          <p className="hero-subtitle">
            Interactive exercises and games for mastering programming concepts
          </p>
        </div>
      </div>
      )}

      {announcements.length > 0 && (
        <ExpandablePanel
          title={lang==='ar' ? 'الإعلانات' : 'Announcements'}
          icon={<Megaphone size={16} />}
          isOpen={!annCollapsed}
          onToggle={(open)=>setAnnCollapsed(!open)}
          duration={200}
          accentColor="#800020"
          className={styles.announcementsCard}
        >
            {/* Search */}
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
              <input
                type="search"
                placeholder={lang==='ar'?'ابحث في الإعلانات':'Search announcements'}
                value={announcementSearch}
                onChange={(e)=>setAnnouncementSearch(e.target.value)}
                style={{ flex:1, padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:10 }}
              />
            </div>

            {/* Date Filters */}
            <div className={styles.filterButtons}>
            {[
              { key: 'all', label: 'All' },
              { key: '3days', label: lang === 'en' ? 'Last 3 Days' : 'آخر 3 أيام' },
              { key: '7days', label: lang === 'en' ? 'Last 7 Days' : 'آخر 7 أيام' },
              { key: '30days', label: lang === 'en' ? 'Last 30 Days' : 'آخر 30 يوم' }
              ].map(filter => (
                <Button
                  key={filter.key}
                  onClick={() => setAnnouncementFilter(filter.key)}
                  variant={announcementFilter === filter.key ? 'primary' : 'outline'}
                  size="sm"
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className={styles.announcementsList}>
            {filteredAnnouncements.map(announcement => {
              const announcementId = announcement.docId || announcement.id;
              const content = lang === 'ar' && announcement.content_ar ? announcement.content_ar : announcement.content;
              const isLong = content && content.length > 200;
              const expanded = expandedAnnouncements[announcementId] || false;
              const dtMs = announcement.createdAt?.seconds ? announcement.createdAt.seconds*1000 : new Date(announcement.createdAt || 0).getTime();
              const dateObj = new Date(dtMs || Date.now());
              
              return (
                <Card key={announcementId} className={styles.announcementItem}>
                  <CardBody>
                    <div style={{ display:'grid', gridTemplateColumns:'100px 1fr', gap:12, alignItems:'stretch' }}>
                      {/* Left date rail */}
                      <div style={{ textAlign:'right', color:'#6b7280', fontSize:13, paddingRight:12, borderRight:'1px solid #e5e7eb', height:'100%' }}>
                        <div>{dateObj.toLocaleDateString(undefined, { month:'short', day:'2-digit' })}</div>
                        <div style={{ fontSize:12, opacity:.9 }}>{dateObj.getFullYear()}</div>
                      </div>
                      <div>
                        <h3 className={styles.announcementTitle} style={{ marginTop:0 }}>{announcement.title}</h3>
                        <p className={`${styles.announcementContent} ${isLong && !expanded ? styles.collapsed : ''}`} style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                          {content}
                        </p>
                      </div>
                    </div>
                    {announcement.link && (
                      <div className={styles.announcementLink}>
                        <a href={announcement.link} target="_blank" rel="noopener noreferrer">
                          <Link2 size={14} /> Link: {announcement.link}
                        </a>
                      </div>
                    )}
                    {isLong && (
                      <Button
                        onClick={() => setExpandedAnnouncements(prev => ({
                          ...prev,
                          [announcementId]: !prev[announcementId]
                        }))}
                        variant="ghost"
                        size="sm"
                        className={styles.expandButton}
                      >
                        {expanded ? (lang === 'en' ? '▲ Show Less' : '▲ عرض أقل') : (lang === 'en' ? '▼ Read More' : '▼ اقرأ المزيد')}
                      </Button>
                    )}
                    <div className={styles.announcementDate}>
                      <small>{announcement.createdAt ? formatDateTime(announcement.createdAt) : ''}</small>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
              {filteredAnnouncements.length === 0 && (
                <div className={styles.emptyAnnouncements}>
                  {lang === 'en' ? 'No announcements in this period' : 'لا توجد إعلانات في هذه الفترة'}
                </div>
              )}
            </div>
        </ExpandablePanel>
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
          {activeTab !== null && (
            <div className="course-content">
              {/* Type chips (same style as ActivitiesPage) */}
              <div style={{ display:'inline-flex', gap:8, flexWrap:'wrap', margin:'0.75rem 0', marginRight:12 }}>
                <button
                  onClick={() => setActivityTypeFilter('all')}
                  style={{ padding:'6px 12px', borderRadius:999, border:'1px solid rgba(0,0,0,0.06)', background:activityTypeFilter==='all'?'#800020':'#fff', color:activityTypeFilter==='all'?'#fff':'#800020', fontWeight:700 }}
                >
                  {typeLabels[lang === 'ar' ? 'ar' : 'en'].all}
                </button>
                <button
                  onClick={() => setActivityTypeFilter('training')}
                  style={{ padding:'6px 12px', borderRadius:999, border:'1px solid #bbdefb', background:activityTypeFilter==='training'?'#1976d2':'#e3f2fd', color:activityTypeFilter==='training'?'#fff':'#1976d2', display:'inline-flex', alignItems:'center', gap:6 }}
                >
                  <BookOpen size={14}/> {typeLabels[lang === 'ar' ? 'ar' : 'en'].training}
                </button>
                <button
                  onClick={() => setActivityTypeFilter('homework')}
                  style={{ padding:'6px 12px', borderRadius:999, border:'1px solid #ffe0b2', background:activityTypeFilter==='homework'?'#f57c00':'#fff3e0', color:activityTypeFilter==='homework'?'#fff':'#b45309', display:'inline-flex', alignItems:'center', gap:6 }}
                >
                  <ClipboardList size={14}/> {typeLabels[lang === 'ar' ? 'ar' : 'en'].homework}
                </button>
                <button
                  onClick={() => setActivityTypeFilter('quiz')}
                  style={{ padding:'6px 12px', borderRadius:999, border:'1px solid #e0e7ff', background:activityTypeFilter==='quiz'?'#6366f1':'#eef2ff', color:activityTypeFilter==='quiz'?'#fff':'#4f46e5', display:'inline-flex', alignItems:'center', gap:6 }}
                >
                  <HelpCircle size={14}/> {typeLabels[lang === 'ar' ? 'ar' : 'en'].quiz}
                </button>
              </div>

              {/* Difficulty chips */}
              <div style={{ display:'inline-flex', gap:8, flexWrap:'wrap', marginBottom:'1rem' }}>
                {[ 
                  {id:'all', key:'all', bg:'#f3f4f6', fg:'#374151'},
                  {id:'beginner', key:'beginner', bg:'#e8f5e9', fg:'#2e7d32'},
                  {id:'intermediate', key:'intermediate', bg:'#fff7ed', fg:'#b45309'},
                  {id:'advanced', key:'advanced', bg:'#fee2e2', fg:'#b91c1c'}
                ].map(lv => {
                  const active = difficultyFilter === lv.id;
                  const labels = difficultyLabels[lang === 'ar' ? 'ar' : 'en'];
                  return (
                    <button
                      key={lv.id}
                      onClick={() => setDifficultyFilter(lv.id)}
                      style={{
                        padding:'6px 12px',
                        borderRadius:999,
                        border:`1px solid ${active ? lv.fg : lv.fg + '55'}`,
                        background: active ? lv.fg : lv.bg,
                        color: active ? '#fff' : lv.fg,
                        display:'inline-flex',
                        alignItems:'center',
                        gap:6,
                        fontWeight:600
                      }}
                    >
                      <Award size={14}/> {labels[lv.key]}
                    </button>
                  );
                })}
              </div>

              
              {loading ? (
                <Loading variant="overlay" message={t('loading') || 'Loading...'} />
              ) : (
                <div className="activities-grid">
                  {filterActivities(currentCourseActivities).map(activity => {
                    const key = activity.docId || activity.id;
                    const title = lang === 'ar'
                      ? (activity.title_ar || activity.title_en || key)
                      : (activity.title_en || activity.title_ar || key);
                    const description = lang === 'ar'
                      ? (activity.description_ar || activity.description_en || '—')
                      : (activity.description_en || activity.description_ar || '—');

                    return (
                      <div key={key} className="activity-card">
                        <h3 style={{ margin: 0, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'0.45rem', flexWrap:'wrap' }}>
                            <span>{title}</span>
                            {activity.allowRetake && (
                              <span
                                title={lang==='ar' ? 'يسمح بالإعادة' : 'Retake allowed'}
                                style={{ background:'#17a2b8', color:'#fff', padding:4, borderRadius:6, display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24 }}
                              >
                                <RotateCcw size={14} />
                              </span>
                            )}
                          </span>

                          {/* Compact details icon in header */}
                          <button
                            type="button"
                            onClick={() => { /* navigate to details view when implemented */ }}
                            aria-label={lang==='ar' ? 'التفاصيل' : 'Details'}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 999,
                              border: '1px solid #e5e7eb',
                              background: '#f9fafb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Info size={14} />
                          </button>
                        </h3>

                        <p style={{ color:'#666', fontSize:'0.84rem', margin:0 }}>
                          {description}
                        </p>

                        <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
                          <span style={{ background:'#e8f5e9', color:'#2e7d32', padding:'0.25rem 0.75rem', borderRadius:12, fontSize:'0.85rem', display:'inline-flex', alignItems:'center', gap:6 }}>
                            <Award size={14}/> {difficultyLabels[lang === 'ar' ? 'ar' : 'en'][activity.difficulty || 'beginner']}
                          </span>
                          <span style={{ background:'#e3f2fd', color:'#1976d2', padding:'0.25rem 0.75rem', borderRadius:12, fontSize:'0.85rem', display:'inline-flex', alignItems:'center', gap:6 }}>
                            {activity.type==='quiz' ? <HelpCircle size={14}/> : activity.type==='homework' ? <ClipboardList size={14}/> : <BookOpen size={14}/>} {typeLabels[lang === 'ar' ? 'ar' : 'en'][activity.type || 'training']}
                          </span>
                          {activity.optional && (
                            <span style={{ background:'#fff3e0', color:'#f57c00', padding:'0.25rem 0.75rem', borderRadius:12, fontSize:'0.85rem' }}>{lang==='ar' ? 'اختياري' : 'Optional'}</span>
                          )}
                        </div>

                        {/* Icon-only buttons: Start + Details */}
                        <div style={{ marginTop:'auto', display:'flex', gap:'0.5rem' }}>
                          <Button
                            variant="success"
                            size="small"
                            style={{ width: 40, height: 40, padding: 0, borderRadius: 999 }}
                            onClick={() => window.open(activity.url, '_blank')}
                            aria-label={lang==='ar' ? 'ابدأ' : 'Start'}
                          >
                            <Play size={18} />
                          </Button>
                          <Button
                            variant="secondary"
                            size="small"
                            style={{ width: 40, height: 40, padding: 0, borderRadius: 999, background: '#f5f5f5', color: '#333', border: '1px solid #e5e5e5' }}
                            onClick={() => { /* Navigate to details */ }}
                            aria-label={lang==='ar' ? 'التفاصيل' : 'Details'}
                          >
                            <Info size={18} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
