import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Joyride from 'react-joyride';
import { Globe2, Code2, Monitor, Sigma, BookOpen, Award, HelpCircle, ClipboardList, Play, StarOff, Hourglass, Repeat, CheckCircle, Star, Pin, Clock, AlertCircle, FileText, Link2, Video, LayoutGrid, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Tabs from '../components/ui/Tabs';
import { getActivities, getAnnouncements, getCourses, getResources } from '../firebase/firestore';
import { getAllQuizzes } from '../firebase/quizzes';
import { getUserSubmissions } from '../firebase/submissions';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLang } from '../contexts/LangContext';
import { formatDateTime } from '../utils/date';
import { Loading } from '../components/ui';
import UnifiedCard from '../components/UnifiedCard';
import AuthForm from '../components/AuthForm';
import './HomePage.css';

const HomePage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Mode: 'activities' | 'resources' | 'quizzes'
  const mode = searchParams.get('mode') || 'activities';
  
  // Auto-search from URL params (from notifications)
  const urlSearchTerm = searchParams.get('search') || '';
  
  // Filter view mode: 'full' | 'minified'
  const [filterViewMode, setFilterViewMode] = useState(() => {
    try {
      return localStorage.getItem('filterViewMode') || 'full';
    } catch {
      return 'full';
    }
  });

  // Help tour state
  const [runTour, setRunTour] = useState(false);
  const filtersRef = useRef(null);
  const gridRef = useRef(null);
  const tourSeenKey = `homePageHelpSeen_${mode}`;
  
  // Data states
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  
  // User data
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [bookmarks, setBookmarks] = useState({ activities: {}, resources: {}, quizzes: {} });
  const [userProgress, setUserProgress] = useState({});
  
  // Common filters (visible for all modes)
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  
  // Auto-fill search when URL param changes
  useEffect(() => {
    if (urlSearchTerm && urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
      // Clear the URL param after setting search
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [urlSearchTerm, searchTerm, searchParams, navigate]);
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [completedFilter, setCompletedFilter] = useState(false);
  const [requiredFilter, setRequiredFilter] = useState(false);
  const [optionalFilter, setOptionalFilter] = useState(false);
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [pendingFilter, setPendingFilter] = useState(false);
  const [retakableFilter, setRetakableFilter] = useState(false);
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [gradedFilter, setGradedFilter] = useState('all'); // 'all' | 'graded' | 'not_graded'
  
  // Mode-specific filters
  const [activityTypeFilter, setActivityTypeFilter] = useState('all'); // For activities
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all'); // For resources
  const [classFilter, setClassFilter] = useState('all'); // For quizzes

  // Save filter view mode preference
  useEffect(() => {
    try {
      localStorage.setItem('filterViewMode', filterViewMode);
    } catch {}
  }, [filterViewMode]);

  // Listen for filter view mode changes from navbar
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.filterViewMode) {
        setFilterViewMode(e.detail.filterViewMode);
      }
    };
    window.addEventListener('filter-view-mode-changed', handler);
    return () => window.removeEventListener('filter-view-mode-changed', handler);
  }, []);

  // Listen for help button click from navbar
  useEffect(() => {
    const handleHelpClick = () => {
      console.log('[HomePage] Help button clicked, starting tour for mode:', mode);
      setRunTour(true);
    };
    
    window.addEventListener('app:help', handleHelpClick);
    return () => window.removeEventListener('app:help', handleHelpClick);
  }, [mode]);

  // Initialize mode from URL
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode && ['activities', 'resources', 'quizzes'].includes(urlMode)) {
      // Mode is already set via searchParams
    }
  }, [searchParams]);

  // Load user data
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setActivities([]);
      setResources([]);
      setQuizzes([]);
      setAnnouncements([]);
      setCourses([]);
      return;
    }
    loadData();
  }, [authLoading, user]);

  // Load user enrollments, bookmarks, progress
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        setEnrolledClasses(Array.isArray(data.enrolledClasses) ? data.enrolledClasses : []);
        setUserData(data);
        setBookmarks({
          activities: (data.bookmarks && data.bookmarks.activities) || {},
          resources: (data.bookmarks && data.bookmarks.resources) || {},
          quizzes: (data.bookmarks && data.bookmarks.quizzes) || {}
        });
        setUserProgress(data.resourceProgress || {});
        
        // Load submissions
        const submissionsResult = await getUserSubmissions(user.uid);
        if (submissionsResult.success) {
          const subs = {};
          submissionsResult.data.forEach(sub => {
            subs[sub.activityId] = sub;
          });
          setSubmissions(subs);
        }
      } catch (e) {
        if (e?.code === 'permission-denied') {
          console.warn('[Home] permission-denied reading users/', user.uid);
        } else {
          console.error('[Home] enrollments error:', e);
        }
      }
    };
    loadUserData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesResult, resourcesResult, quizzesResult, announcementsResult, coursesResult] = await Promise.all([
        getActivities(),
        getResources(),
        getAllQuizzes(),
        getAnnouncements(),
        getCourses()
      ]);
      
      if (activitiesResult.success) setActivities(activitiesResult.data || []);
      if (resourcesResult.success) setResources(resourcesResult.data || []);
      if (quizzesResult.success) setQuizzes(quizzesResult.data || []);
      if (announcementsResult.success) setAnnouncements(announcementsResult.data || []);
      if (coursesResult.success) setCourses(coursesResult.data || []);
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current items based on mode and course tab
  const getCurrentItems = () => {
    if (mode === 'resources') return resources;
    if (mode === 'quizzes') return quizzes;
    // Filter activities by course tab
    if (activeTab === '') {
      return activities.filter(a => a.show !== false && (!a.classId || enrolledClasses.includes(a.classId)));
    }
    return activities.filter(a => 
      (a.course || 'general') === activeTab && 
      a.show !== false && 
      (!a.classId || enrolledClasses.includes(a.classId))
    );
  };

  // Filter items based on mode and filters
  const filteredItems = useMemo(() => {
    const items = getCurrentItems();
    let filtered = [...items];

    // Common: Search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item => {
        if (mode === 'quizzes') {
          const titleEn = (item.title_en || item.title || '').toLowerCase();
          const titleAr = (item.title_ar || '').toLowerCase();
          const descEn = (item.description_en || item.description || '').toLowerCase();
          const descAr = (item.description_ar || '').toLowerCase();
          return titleEn.includes(q) || titleAr.includes(q) || descEn.includes(q) || descAr.includes(q);
        }
        if (mode === 'resources') {
          const titleEn = (item.title_en || item.title || '').toLowerCase();
          const titleAr = (item.title_ar || '').toLowerCase();
          const descEn = (item.description_en || item.description || '').toLowerCase();
          const descAr = (item.description_ar || '').toLowerCase();
          return titleEn.includes(q) || titleAr.includes(q) || descEn.includes(q) || descAr.includes(q);
        }
        // Activities
        const titleEn = (item.title_en || '').toLowerCase();
        const titleAr = (item.title_ar || '').toLowerCase();
        const descEn = (item.description_en || '').toLowerCase();
        const descAr = (item.description_ar || '').toLowerCase();
        return titleEn.includes(q) || titleAr.includes(q) || descEn.includes(q) || descAr.includes(q);
      });
    }

    // Common: Bookmark
    if (bookmarkFilter) {
      filtered = filtered.filter(item => {
        const id = item.docId || item.id;
        return !!bookmarks[mode]?.[id];
      });
    }

    // Common: Difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(item => {
        const level = (item.level || item.difficulty || 'beginner').toLowerCase();
        return level === difficultyFilter.toLowerCase();
      });
    }

    // Common: Completed
    if (completedFilter) {
      filtered = filtered.filter(item => {
        const id = item.docId || item.id;
        if (mode === 'resources') {
          return userProgress[id]?.completed;
        }
        if (mode === 'activities') {
          return submissions[id]?.status === 'graded';
        }
        // Quizzes - check submissions
        return false; // TODO: implement quiz completion check
      });
    }

    // Common: Required
    if (requiredFilter) {
      filtered = filtered.filter(item => !item.optional);
    }

    // Common: Optional
    if (optionalFilter) {
      filtered = filtered.filter(item => !!item.optional);
    }

    // Common: Overdue
    if (overdueFilter) {
      filtered = filtered.filter(item => {
        if (!item.dueDate) return false;
        const dueDate = item.dueDate?.seconds ? new Date(item.dueDate.seconds * 1000) : new Date(item.dueDate);
        const now = new Date();
        const id = item.docId || item.id;
        const isCompleted = mode === 'resources' 
          ? userProgress[id]?.completed 
          : (mode === 'activities' ? submissions[id]?.status === 'graded' : false);
        return dueDate < now && !isCompleted;
      });
    }

    // Common: Pending
    if (pendingFilter) {
      filtered = filtered.filter(item => {
        const id = item.docId || item.id;
        if (mode === 'resources') {
          return !userProgress[id]?.completed;
        }
        if (mode === 'activities') {
          return !submissions[id] || submissions[id]?.status !== 'graded';
        }
        return true; // Quizzes are always pending until taken
      });
    }

    // Common: Retakable
    if (retakableFilter) {
      filtered = filtered.filter(item => !!(item.allowRetake || item.retakeAllowed));
    }

    // Common: Featured
    if (featuredFilter) {
      filtered = filtered.filter(item => !!item.featured);
    }

    // Common: Graded (only for activities/quizzes with submissions)
    if (gradedFilter === 'graded') {
      filtered = filtered.filter(item => {
        const id = item.docId || item.id;
        return submissions[id]?.status === 'graded';
      });
    } else if (gradedFilter === 'not_graded') {
      filtered = filtered.filter(item => {
        const id = item.docId || item.id;
        return !submissions[id] || submissions[id]?.status !== 'graded';
      });
    }

    // Mode-specific filters
    if (mode === 'activities' && activityTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === activityTypeFilter);
    }

    if (mode === 'resources' && resourceTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === resourceTypeFilter);
    }

    if (mode === 'quizzes' && classFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.classId === classFilter || item.className === classFilter
      );
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => {
      const aDate = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const bDate = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return (bDate || 0) - (aDate || 0);
    });

    return filtered;
  }, [
    mode, activities, resources, quizzes, searchTerm, bookmarkFilter, difficultyFilter,
    completedFilter, requiredFilter, optionalFilter, overdueFilter, pendingFilter,
    retakableFilter, featuredFilter, gradedFilter, activityTypeFilter, resourceTypeFilter,
    classFilter, bookmarks, userProgress, submissions, enrolledClasses, activeTab
  ]);

  // Get available classes for quiz filter
  const availableClasses = useMemo(() => {
    if (mode !== 'quizzes') return [];
    const classes = new Set();
    quizzes.forEach(q => {
      if (q.classId) classes.add(q.classId);
      if (q.className) classes.add(q.className);
    });
    return Array.from(classes);
  }, [mode, quizzes]);

  // Calculate comprehensive stats for all modes
  const stats = useMemo(() => {
    const items = getCurrentItems();
    const now = new Date();
    
    if (mode === 'resources') {
      const completedCount = Object.values(userProgress).filter(p => p.completed).length;
      const requiredTotal = items.filter(r => !r.optional).length;
      const requiredCompleted = items.filter(r => !r.optional).filter(r => {
        const rid = r.docId || r.id;
        return userProgress[rid]?.completed;
      }).length;
      const requiredRemaining = Math.max(0, requiredTotal - requiredCompleted);
      const overdueCount = items.filter(r => {
        if (!r.dueDate) return false;
        const dueDate = r.dueDate?.seconds ? new Date(r.dueDate.seconds * 1000) : new Date(r.dueDate);
        const rid = r.docId || r.id;
        return dueDate < now && !userProgress[rid]?.completed;
      }).length;
      const optionalCount = items.filter(r => r.optional).length;
      const pendingCount = items.filter(r => {
        const rid = r.docId || r.id;
        return !userProgress[rid]?.completed;
      }).length;
      const featuredCount = items.filter(r => r.featured).length;
      return { 
        completed: completedCount, 
        required: requiredRemaining, 
        overdue: overdueCount,
        optional: optionalCount,
        pending: pendingCount,
        featured: featuredCount
      };
    } else if (mode === 'activities') {
      const completedCount = items.filter(a => {
        const aid = a.docId || a.id;
        return submissions[aid]?.status === 'graded';
      }).length;
      const pendingCount = items.filter(a => {
        const aid = a.docId || a.id;
        return !submissions[aid] || submissions[aid]?.status !== 'graded';
      }).length;
      const overdueCount = items.filter(a => {
        if (!a.dueDate) return false;
        const dueDate = a.dueDate?.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
        const aid = a.docId || a.id;
        return dueDate < now && submissions[aid]?.status !== 'graded';
      }).length;
      const optionalCount = items.filter(a => a.optional).length;
      const requiredCount = items.filter(a => !a.optional).length;
      const featuredCount = items.filter(a => a.featured).length;
      return {
        completed: completedCount,
        pending: pendingCount,
        overdue: overdueCount,
        optional: optionalCount,
        required: requiredCount,
        featured: featuredCount
      };
    } else if (mode === 'quizzes') {
      const totalCount = items.length;
      const featuredCount = items.filter(q => q.featured).length;
      const retakableCount = items.filter(q => !!(q.allowRetake || q.retakeAllowed)).length;
      // For quizzes, we can't easily determine completion without quiz submissions
      return {
        total: totalCount,
        featured: featuredCount,
        retakable: retakableCount
      };
    }
    return null;
  }, [mode, activities, resources, quizzes, userProgress, submissions, enrolledClasses, activeTab]);

  const handleModeChange = (newMode) => {
    setSearchParams({ mode: newMode });
  };

  const handleBookmark = async (itemId, itemMode) => {
    if (!user) return;
    try {
      const next = { ...bookmarks };
      const isAdding = !next[itemMode][itemId];
      if (next[itemMode][itemId]) {
        delete next[itemMode][itemId];
      } else {
        next[itemMode][itemId] = true;
      }
      setBookmarks(next);
      await setDoc(doc(db, 'users', user.uid), { 
        bookmarks: {
          activities: next.activities,
          resources: next.resources,
          quizzes: next.quizzes
        }
      }, { merge: true });
    } catch (e) {
      console.error('Failed to update bookmark:', e);
    }
  };

  const handleResourceComplete = async (resourceId) => {
    if (!user) return;
    const isCompleted = userProgress[resourceId]?.completed || false;
    const newProgress = {
      ...userProgress,
      [resourceId]: {
        completed: !isCompleted,
        completedAt: !isCompleted ? new Date() : null
      }
    };
    setUserProgress(newProgress);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        resourceProgress: newProgress
      }, { merge: true });
    } catch (error) {
      console.error('Error updating progress:', error);
      setUserProgress(userProgress); // Revert on error
    }
  };

  // Get primary color from CSS variable
  const getPrimaryColor = () => {
    if (typeof window === 'undefined') return '#800020';
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue('--color-primary').trim() || '#800020';
  };

  const primaryColor = getPrimaryColor();

  if (authLoading) {
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} />;
  }

  if (!user) {
    return (
      <div className="home-page">
        <AuthForm />
      </div>
    );
  }

  const isMinified = filterViewMode === 'minified';

  return (
    <div className="home-page" style={{ padding: '1rem 0', position: 'relative' }}>
      {loading && <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} />}
      <div className="content-section" style={{ position: 'relative' }}>
        {/* Mode Switcher - Using Tabs component */}
        <div data-tour="mode-switcher" style={{ marginBottom: '1.5rem' }}>
          <Tabs
            tabs={[
              {
                value: 'activities',
                label: t('activities') || 'Activities',
                icon: <ClipboardList size={16} />,
                badge: mode === 'activities' ? filteredItems.length : undefined
              },
              {
                value: 'resources',
                label: t('resources') || 'Resources',
                icon: <BookOpen size={16} />,
                badge: mode === 'resources' ? filteredItems.length : undefined
              },
              {
                value: 'quizzes',
                label: t('quizzes') || 'Quizzes',
                icon: <HelpCircle size={16} />,
                badge: mode === 'quizzes' ? filteredItems.length : undefined
              }
            ]}
            activeTab={mode}
            onTabChange={handleModeChange}
            variant="default"
          />
        </div>

        {/* Course Tabs (only for activities) - At top, below mode switcher */}
        {mode === 'activities' && (
          <div style={{ marginBottom: '1.5rem' }}>
        <Tabs
          tabs={[
            {
              value: '',
                  label: lang === 'en' ? 'All' : 'الكل',
              icon: <Globe2 size={16} />,
                  badge: filteredItems.length
            },
            ...(courses.length ? courses : [
              { docId: 'programming', name_en: 'Programming', name_ar: 'البرمجة' },
              { docId: 'computing', name_en: 'Computing', name_ar: 'الحوسبة' },
              { docId: 'algorithm', name_en: 'Algorithm', name_ar: 'الخوارزميات' },
              { docId: 'general', name_en: 'General', name_ar: 'عام' }
            ]).map(c => {
                  // Count activities that match current filters (not all activities)
                  const categoryActivities = filteredItems.filter(a => a.course === c.docId);
              const Icon = c.docId === 'programming' ? Code2
                : c.docId === 'computing' ? Monitor
                : c.docId === 'algorithm' ? Sigma
                : BookOpen;
              return {
                value: c.docId,
                    label: lang === 'ar' ? (c.name_ar || c.name_en || c.docId) : (c.name_en || c.docId),
                icon: <Icon size={16} />,
                badge: categoryActivities.length
              };
            })
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
        />
          </div>
        )}

        {/* Unified Filters Section */}
        <div 
          ref={filtersRef}
          data-tour="filters"
          className="filters-section" 
          style={{
            background: isDark ? '#1a1a1a' : 'white',
            padding: '0.75rem 1rem',
                borderRadius: '12px',
            marginBottom: '1.5rem',
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            position: 'relative',
            border: isDark ? '1px solid #333' : 'none'
          }}>
          {/* Row 1: Search + Stats (compact) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {/* Comprehensive Stats for all modes */}
            {stats && (
              <div 
                data-tour="stats"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.375rem 0.625rem',
                  background: isDark ? '#0f172a' : '#f9fafb',
                  borderRadius: 8,
                  border: isDark ? '1px solid #333' : '1px solid #e5e7eb',
                  fontSize: '0.8125rem',
                  flexWrap: 'wrap',
                  color: isDark ? '#f8fafc' : '#111'
                }}>
                {stats.completed !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={14} style={{ color: '#16a34a' }} />
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>{stats.completed}</span>
                  </div>
                )}
                {stats.pending !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Hourglass size={14} style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stats.pending}</span>
                  </div>
                )}
                {stats.overdue !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} style={{ color: '#dc2626' }} />
                    <span style={{ fontWeight: 700, color: '#dc2626' }}>{stats.overdue}</span>
                  </div>
                )}
                {stats.required !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={14} style={{ color: '#b91c1c' }} />
                    <span style={{ fontWeight: 700, color: '#b91c1c' }}>{stats.required}</span>
                  </div>
                )}
                {stats.optional !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BookOpen size={14} style={{ color: '#f57c00' }} />
                    <span style={{ fontWeight: 700, color: '#f57c00' }}>{stats.optional}</span>
                  </div>
                )}
                {stats.featured !== undefined && stats.featured > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={t('featured') || 'Featured'}>
                    <Pin size={14} style={{ color: '#4f46e5' }} />
                    <span style={{ fontWeight: 700, color: '#4f46e5' }}>{stats.featured}</span>
                  </div>
                )}
                {stats.bookmarked !== undefined && stats.bookmarked > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={t('bookmarked') || 'Bookmarked'}>
                    <Star size={14} style={{ color: '#f5c518' }} fill="#f5c518" />
                    <span style={{ fontWeight: 700, color: '#f5c518' }}>{stats.bookmarked}</span>
                  </div>
                )}
                {stats.retakable !== undefined && stats.retakable > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={t('retake_allowed') || 'Retake Allowed'}>
                    <Repeat size={14} style={{ color: '#0ea5e9' }} />
                    <span style={{ fontWeight: 700, color: '#0ea5e9' }}>{stats.retakable}</span>
                  </div>
                )}
                {stats.total !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={t('total') || 'Total'}>
                    <HelpCircle size={14} style={{ color: primaryColor }} />
                    <span style={{ fontWeight: 700, color: primaryColor }}>{stats.total}</span>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }} data-tour="search">
                    <input
                      type="search"
                placeholder={
                  mode === 'resources' ? (t('search_resources') || 'Search resources...') :
                  mode === 'quizzes' ? (t('search_quizzes') || 'Search quizzes...') :
                  (t('search_activities') || 'Search activities...')
                }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: isDark ? '1px solid #333' : '1px solid #e5e7eb',
                  background: isDark ? '#0f172a' : '#fff',
                  color: isDark ? '#f8fafc' : '#111',
                  borderRadius: 8,
                  fontSize: '0.875rem'
                }}
                title={t('search') || 'Search'}
                    />
                  </div>
                </div>

          {/* Row 2: Common Filter Chips - Show word+icon or icon-only based on view mode */}
          <div data-tour="status-filters" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {/* Status chips - word+icon (full) or icon-only (minified) */}
            {isMinified ? (
              <>
                <button
                  onClick={() => setCompletedFilter(v => !v)}
                  title={t('completed') || 'Completed'}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: '1px solid #bbf7d0',
                    background: completedFilter ? '#16a34a' : '#ecfdf5',
                    color: completedFilter ? '#fff' : '#16a34a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <CheckCircle size={14} />
                </button>
                
                <button
                  onClick={() => setPendingFilter(v => !v)}
                  title={t('pending') || 'Pending'}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: '1px solid #fde68a',
                    background: pendingFilter ? '#f59e0b' : '#fffbeb',
                    color: pendingFilter ? '#fff' : '#b45309',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <Hourglass size={14} />
                </button>

                <button
                  onClick={() => setRequiredFilter(v => !v)}
                  title={t('required') || 'Required'}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: '1px solid #fecaca',
                    background: requiredFilter ? '#b91c1c' : '#fee2e2',
                    color: requiredFilter ? '#fff' : '#b91c1c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <AlertCircle size={14} />
                </button>

                <button
                  onClick={() => setOptionalFilter(v => !v)}
                  title={t('optional') || 'Optional'}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: '1px solid #fed7aa',
                    background: optionalFilter ? '#f57c00' : '#fff3e0',
                    color: optionalFilter ? '#fff' : '#b45309',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <BookOpen size={14} />
                </button>

                <button
                  onClick={() => setOverdueFilter(v => !v)}
                  title={t('overdue') || 'Overdue'}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: '1px solid #fecaca',
                    background: overdueFilter ? '#dc2626' : '#fee2e2',
                    color: overdueFilter ? '#fff' : '#dc2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <Clock size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCompletedFilter(v => !v)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #bbf7d0',
                    background: completedFilter ? '#16a34a' : '#ecfdf5',
                    color: completedFilter ? '#fff' : '#16a34a',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle size={12} />
                  {t('completed') || 'Completed'}
                </button>
                
                <button
                  onClick={() => setPendingFilter(v => !v)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #fde68a',
                    background: pendingFilter ? '#f59e0b' : '#fffbeb',
                    color: pendingFilter ? '#fff' : '#b45309',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <Hourglass size={12} />
                  {t('pending') || 'Pending'}
                </button>

                <button
                  onClick={() => setRequiredFilter(v => !v)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #fecaca',
                    background: requiredFilter ? '#b91c1c' : '#fee2e2',
                    color: requiredFilter ? '#fff' : '#b91c1c',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <AlertCircle size={12} />
                  {t('required') || 'Required'}
                </button>

                <button
                  onClick={() => setOptionalFilter(v => !v)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #fed7aa',
                    background: optionalFilter ? '#f57c00' : '#fff3e0',
                    color: optionalFilter ? '#fff' : '#b45309',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <BookOpen size={12} />
                  {t('optional') || 'Optional'}
                </button>

                <button
                  onClick={() => setOverdueFilter(v => !v)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #fecaca',
                    background: overdueFilter ? '#dc2626' : '#fee2e2',
                    color: overdueFilter ? '#fff' : '#dc2626',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <Clock size={12} />
                  {t('overdue') || 'Overdue'}
                </button>
              </>
            )}
              </div>

          {/* Row 3: Difficulty + Mode-specific + Icon toggles */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Difficulty chips - Show first */}
            <div data-tour="difficulty-filters" style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setDifficultyFilter('all')}
                title={t('all_levels') || 'All Levels'}
                style={{
                  padding: isMinified ? '4px 8px' : '4px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(0,0,0,0.06)',
                  background: difficultyFilter === 'all' ? primaryColor : '#fff',
                  color: difficultyFilter === 'all' ? '#fff' : primaryColor,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: isMinified ? 0 : 4
                }}
              >
                <Globe2 size={12} />
                {!isMinified && <span>{t('all_levels') || 'All Levels'}</span>}
              </button>
                  {[
                    { id: 'beginner', label: t('beginner') || 'Beginner', bg: '#e8f5e9', fg: '#2e7d32' },
                    { id: 'intermediate', label: t('intermediate') || 'Intermediate', bg: '#fff7ed', fg: '#b45309' },
                    { id: 'advanced', label: t('advanced') || 'Advanced', bg: '#fee2e2', fg: '#b91c1c' }
                  ].map(lv => {
                    const active = difficultyFilter === lv.id;
                    return (
                  <button
                    key={lv.id}
                    onClick={() => setDifficultyFilter(active ? 'all' : lv.id)}
                    style={{
                      padding: isMinified ? '4px 8px' : '4px 10px',
                      borderRadius: 999,
                      border: '1px solid transparent',
                      background: active ? lv.fg : lv.bg,
                      color: active ? '#fff' : lv.fg,
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: isMinified ? 0 : 4,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title={lv.label}
                    aria-label={lv.label}
                  >
                    <Award size={12} />
                    {!isMinified && <span>{lv.label}</span>}
                      </button>
                    );
                  })}
                </div>

            {/* Mode-specific type filters */}
            {mode === 'activities' && (
              <div data-tour="activity-type-filters" style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActivityTypeFilter('all')}
                  title={t('all_types') || 'All Types'}
                  style={{
                    padding: isMinified ? '4px 8px' : '4px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: activityTypeFilter === 'all' ? primaryColor : '#fff',
                    color: activityTypeFilter === 'all' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMinified ? 0 : 4
                  }}
                >
                  <Globe2 size={12} />
                  {!isMinified && <span>{t('all_types') || 'All Types'}</span>}
                </button>
                <button
                  onClick={() => setActivityTypeFilter('training')}
                  style={{
                    padding: isMinified ? '4px 8px' : '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${primaryColor}40`,
                    background: activityTypeFilter === 'training' ? primaryColor : `${primaryColor}15`,
                    color: activityTypeFilter === 'training' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMinified ? 0 : 4
                  }}
                  title={t('training') || 'Training'}
                >
                  <BookOpen size={12} />
                  {!isMinified && <span>{t('training') || 'Training'}</span>}
                </button>
                <button
                  onClick={() => setActivityTypeFilter('homework')}
                  style={{
                    padding: isMinified ? '4px 8px' : '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${primaryColor}40`,
                    background: activityTypeFilter === 'homework' ? primaryColor : `${primaryColor}15`,
                    color: activityTypeFilter === 'homework' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMinified ? 0 : 4
                  }}
                  title={t('homework') || 'Homework'}
                >
                  <ClipboardList size={12} />
                  {!isMinified && <span>{t('homework') || 'Homework'}</span>}
                </button>
                <button
                  onClick={() => setActivityTypeFilter('quiz')}
                  style={{
                    padding: isMinified ? '4px 8px' : '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${primaryColor}40`,
                    background: activityTypeFilter === 'quiz' ? primaryColor : `${primaryColor}15`,
                    color: activityTypeFilter === 'quiz' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMinified ? 0 : 4
                  }}
                  title={t('quiz') || 'Quiz'}
                >
                  <HelpCircle size={12} />
                  {!isMinified && <span>{t('quiz') || 'Quiz'}</span>}
                  </button>
                </div>
            )}

            {mode === 'resources' && (
              <div data-tour="resource-type-filters" style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setResourceTypeFilter('all')}
                  title={t('all_types') || 'All Types'}
                  style={{
                    padding: isMinified ? '4px 8px' : '4px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: resourceTypeFilter === 'all' ? primaryColor : '#fff',
                    color: resourceTypeFilter === 'all' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMinified ? 0 : 4
                  }}
                >
                  <Globe2 size={12} />
                  {!isMinified && <span>{t('all_types') || 'All Types'}</span>}
                </button>
                <button
                  onClick={() => setResourceTypeFilter('video')}
                  style={{
                    padding: isMinified ? '4px 8px' : '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${primaryColor}40`,
                    background: resourceTypeFilter === 'video' ? primaryColor : `${primaryColor}15`,
                    color: resourceTypeFilter === 'video' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMinified ? 0 : 4
                  }}
                  title={t('video') || 'Video'}
                >
                  <Video size={12} />
                  {!isMinified && <span>{t('video') || 'Video'}</span>}
                </button>
                <button
                  onClick={() => setResourceTypeFilter('link')}
                  style={{
                    padding: isMinified ? '4px 8px' : '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${primaryColor}40`,
                    background: resourceTypeFilter === 'link' ? primaryColor : `${primaryColor}15`,
                    color: resourceTypeFilter === 'link' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMinified ? 0 : 4
                  }}
                  title={t('link') || 'Link'}
                >
                  <Link2 size={12} />
                  {!isMinified && <span>{t('link') || 'Link'}</span>}
                </button>
                <button
                  onClick={() => setResourceTypeFilter('document')}
                  style={{
                    padding: isMinified ? '4px 8px' : '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${primaryColor}40`,
                    background: resourceTypeFilter === 'document' ? primaryColor : `${primaryColor}15`,
                    color: resourceTypeFilter === 'document' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMinified ? 0 : 4
                  }}
                  title={t('document') || 'Document'}
                >
                  <FileText size={12} />
                  {!isMinified && <span>{t('document') || 'Document'}</span>}
                </button>
              </div>
            )}

            {/* Class filter for quizzes */}
            {mode === 'quizzes' && availableClasses.length > 0 && (
              <div data-tour="class-filter" style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setClassFilter('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: classFilter === 'all' ? primaryColor : '#fff',
                    color: classFilter === 'all' ? '#fff' : primaryColor,
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {t('all_classes') || 'All Classes'}
                </button>
                {availableClasses.map(cls => {
                  const active = classFilter === cls;
                  return (
                    <button
                      key={cls}
                      onClick={() => setClassFilter(active ? 'all' : cls)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        border: '1px solid #cbd5e1',
                        background: active ? '#475569' : '#f1f5f9',
                        color: active ? '#fff' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Icon toggles - Always icon-only, but show word+icon in full mode for bookmark/featured */}
            <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
              {isMinified ? (
                <>
                  <button
                    onClick={() => setBookmarkFilter(v => !v)}
                    title={t('bookmarked') || 'Bookmarked'}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      border: '1px solid #f5c518',
                      background: bookmarkFilter ? '#f5c518' : '#fff',
                      color: bookmarkFilter ? '#1f2937' : '#b45309',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {bookmarkFilter ? <Star size={14} fill="#f5c518" /> : <StarOff size={14} />}
                  </button>
                  <button
                    onClick={() => setFeaturedFilter(v => !v)}
                    title={t('featured') || 'Featured'}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      border: '1px solid #c7d2fe',
                      background: featuredFilter ? '#4f46e5' : '#eef2ff',
                      color: featuredFilter ? '#fff' : '#4f46e5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    onClick={() => setRetakableFilter(v => !v)}
                    title={t('retake_allowed') || 'Retake'}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      border: '1px solid #bae6fd',
                      background: retakableFilter ? '#0ea5e9' : '#ecfeff',
                      color: retakableFilter ? '#fff' : '#0ea5e9',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <Repeat size={14} />
                  </button>
                  <button
                    onClick={() => setGradedFilter(p => p === 'graded' ? 'all' : 'graded')}
                    title={t('graded') || 'Graded'}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      border: '1px solid #bbf7d0',
                      background: gradedFilter === 'graded' ? '#16a34a' : '#ecfdf5',
                      color: gradedFilter === 'graded' ? '#fff' : '#16a34a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <CheckCircle size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setBookmarkFilter(v => !v)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid #f5c518',
                      background: bookmarkFilter ? '#f5c518' : '#fff',
                      color: bookmarkFilter ? '#1f2937' : '#b45309',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {bookmarkFilter ? <Star size={12} fill="#f5c518" /> : <StarOff size={12} />}
                    {t('bookmarked') || 'Bookmarked'}
                  </button>
                  <button
                    onClick={() => setFeaturedFilter(v => !v)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid #c7d2fe',
                      background: featuredFilter ? '#4f46e5' : '#eef2ff',
                      color: featuredFilter ? '#fff' : '#4f46e5',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <Pin size={12} />
                    {t('featured') || 'Featured'}
                  </button>
                  <button
                    onClick={() => setRetakableFilter(v => !v)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid #bae6fd',
                      background: retakableFilter ? '#0ea5e9' : '#ecfeff',
                      color: retakableFilter ? '#fff' : '#0ea5e9',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <Repeat size={12} />
                    {t('retake_allowed') || 'Retake'}
                  </button>
                  <button
                    onClick={() => setGradedFilter(p => p === 'graded' ? 'all' : 'graded')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid #bbf7d0',
                      background: gradedFilter === 'graded' ? '#16a34a' : '#ecfdf5',
                      color: gradedFilter === 'graded' ? '#fff' : '#16a34a',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle size={12} />
                    {t('graded') || 'Graded'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>


        {/* Items Grid */}
              {loading ? (
                <Loading variant="overlay" message={t('loading') || 'Loading...'} />
              ) : (
                <div data-tour="cards-grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {filteredItems.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                color: '#666'
              }}>
                <h3>{t('no_items_found') || 'No items found'}</h3>
                <p>{t('try_adjusting_filters') || 'Try adjusting your filters'}</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const itemId = item.docId || item.id;
                let isCompleted = false;
                let completedAt = null;
                let isBookmarked = false;
                let dueDate = null;

                if (mode === 'resources') {
                  isCompleted = userProgress[itemId]?.completed || false;
                  completedAt = userProgress[itemId]?.completedAt;
                  isBookmarked = !!bookmarks.resources[itemId];
                  dueDate = item.dueDate;
                } else if (mode === 'activities') {
                  const submission = submissions[itemId];
                  isCompleted = submission?.status === 'graded';
                  completedAt = submission?.completedAt || submission?.submittedAt;
                  isBookmarked = !!bookmarks.activities[itemId];
                  dueDate = item.dueDate;
                } else if (mode === 'quizzes') {
                  isBookmarked = !!bookmarks.quizzes[itemId];
                  // TODO: Add quiz completion logic
                }

                    return (
                      <UnifiedCard
                        key={itemId}
                        flavor={mode === 'quizzes' ? 'quiz' : mode === 'resources' ? 'resource' : 'activity'}
                        item={item}
                        lang={lang}
                        t={t}
                        isCompleted={isCompleted}
                        completedAt={completedAt}
                        isBookmarked={isBookmarked}
                        dueDate={dueDate}
                        isMinified={isMinified}
                        primaryColor={primaryColor}
                        onStart={() => {
                          if (mode === 'quizzes') {
                            window.location.href = `/student-quiz/${itemId}`;
                          } else if (mode === 'resources') {
                            if (item.url) {
                              window.open(item.url, '_blank');
                            }
                          } else {
                            // Activities
                            const isQuiz = item.type === 'quiz' || !!item.internalQuizId;
                          if (isQuiz) {
                              window.location.href = `/student-quiz/${item.internalQuizId || itemId}`;
                          } else {
                              window.open(item.url, '_blank');
                            }
                          }
                        }}
                        onComplete={mode === 'resources' ? () => handleResourceComplete(itemId) : undefined}
                        onBookmark={() => handleBookmark(itemId, mode)}
                      />
                    );
              })
              )}
            </div>
          )}
        </div>
      
      {/* Joyride Help Tour */}
      <Joyride
        continuous
        run={runTour}
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep={true}
        spotlightClicks={false}
        steps={[
          {
            target: '[data-tour="mode-switcher"]',
            content: lang === 'ar' 
              ? 'استخدم هذه التبويبات للتبديل بين الأنشطة والموارد والاختبارات'
              : 'Use these tabs to switch between Activities, Resources, and Quizzes',
            disableBeacon: true,
            placement: 'bottom'
          },
          {
            target: '[data-tour="stats"]',
            content: lang === 'ar'
              ? 'هذه الإحصائيات تعرض عدد العناصر المكتملة والمعلقة والمطلوبة والمميزة والمؤرشفة'
              : 'These statistics show counts for completed, pending, required, featured, and bookmarked items',
            disableBeacon: true,
            placement: 'bottom'
          },
          {
            target: '[data-tour="search"]',
            content: lang === 'ar'
              ? 'استخدم هذا الحقل للبحث في العناوين والأوصاف'
              : 'Use this field to search in titles and descriptions',
            disableBeacon: true,
            placement: 'bottom'
          },
          {
            target: '[data-tour="filters"]',
            content: lang === 'ar'
              ? 'استخدم هذه المرشحات للبحث وتصفية العناصر حسب النوع والمستوى والحالة'
              : 'Use these filters to search and filter items by type, level, and status',
            disableBeacon: true,
            placement: 'top'
          },
          {
            target: '[data-tour="status-filters"]',
            content: lang === 'ar'
              ? 'استخدم هذه المرشحات للعثور على العناصر المكتملة أو المعلقة أو المطلوبة أو المؤرشفة'
              : 'Use these filters to find completed, pending, required, or bookmarked items',
            disableBeacon: true,
            placement: 'top'
          },
          {
            target: '[data-tour="difficulty-filters"]',
            content: lang === 'ar'
              ? 'اختر مستوى الصعوبة: مبتدئ، متوسط، أو متقدم'
              : 'Select difficulty level: Beginner, Intermediate, or Advanced',
            disableBeacon: true,
            placement: 'top'
          },
          ...(mode === 'activities' ? [{
            target: '[data-tour="activity-type-filters"]',
            content: lang === 'ar'
              ? 'اختر نوع النشاط: تدريب، واجب منزلي، أو اختبار'
              : 'Select activity type: Training, Homework, or Quiz',
            disableBeacon: true,
            placement: 'top',
            disableScrolling: false
          }] : []),
          ...(mode === 'resources' ? [{
            target: '[data-tour="resource-type-filters"]',
            content: lang === 'ar'
              ? 'اختر نوع المورد: فيديو، رابط، أو مستند'
              : 'Select resource type: Video, Link, or Document',
            disableBeacon: true,
            placement: 'top',
            disableScrolling: false
          }] : []),
          ...(mode === 'quizzes' ? [{
            target: '[data-tour="class-filter"]',
            content: lang === 'ar'
              ? 'اختر الفصل لعرض الاختبارات المرتبطة به'
              : 'Select a class to view quizzes associated with it',
            disableBeacon: true,
            placement: 'top',
            disableScrolling: false
          }] : []),
          {
            target: '[data-tour="cards-grid"]',
            content: lang === 'ar'
              ? 'هذه هي البطاقات التي تعرض العناصر. يمكنك النقر على الأزرار للبدء أو الإكمال أو الإضافة إلى المفضلة'
              : 'These are the cards displaying items. You can click buttons to start, complete, or bookmark',
            disableBeacon: true,
            placement: 'top',
            disableScrolling: false
          }
        ]}
        locale={{
          back: lang === 'ar' ? 'السابق' : 'Back',
          close: lang === 'ar' ? 'إغلاق' : 'Close',
          last: lang === 'ar' ? 'إنهاء' : 'Finish',
          next: lang === 'ar' ? 'التالي' : 'Next',
          skip: lang === 'ar' ? 'تخطي' : 'Skip'
        }}
        styles={{
          options: {
            primaryColor: primaryColor,
            textColor: isDark ? '#fff' : '#000',
            backgroundColor: isDark ? '#1a1a1a' : '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            arrowColor: isDark ? '#1a1a1a' : '#fff',
            zIndex: 10000
          }
        }}
        callback={(data) => {
          console.log('[HomePage] Joyride callback:', data);
          if (data.status === 'finished' || data.status === 'skipped') {
            console.log('[HomePage] Tour finished/skipped, setting runTour to false');
            setRunTour(false);
            try {
              localStorage.setItem(tourSeenKey, 'true');
              console.log('[HomePage] Saved tour seen key:', tourSeenKey);
            } catch (e) {
              console.error('[HomePage] Failed to save tour seen key:', e);
            }
          }
        }}
      />
    </div>
  );
};

export default HomePage;
