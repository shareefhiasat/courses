import React, { useEffect, useState, useMemo, useRef, memo, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import JoyrideTour from '@ui/JoyrideTour';
import iconTypes from '@constants/iconTypes';
import logger from '@utils/logger';
const { getThemedIcon, getColoredIcon, deriveIconColor, getIconWithColor } = iconTypes;
import { useTheme } from '@contexts/ThemeContext';
import { Tabs } from '@ui';
import { getActivities, getAnnouncements, getResources } from '@services/business/activityService';
import { getCourses } from '@services/business/courseService';
import { getAllQuizzes } from '@services/business/quizService';
import { getUserSubmissions } from '@services/business/submissionService';
import { getUserProfile } from '@services/business/userService';
import { getCategories } from '@services/business/categoryService';
import { useAuth } from '@contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@services/other/config';
import { useLang } from '@contexts/LangContext';
import { formatDateTime } from '@utils/date';
import { SUBMISSION_STATUS, TASK_STATUS, getStatusLabel } from '@utils/sharedTypes';
import { useFilterCounts } from '@hooks/useFilterCounts';
import { getActivityTypeConfig } from '@constants/activityTypes';
import { getDifficultyConfig } from '@constants/difficultyTypes';
import { Loading, Card, CardBody, Modal } from '@ui';
import UnifiedCard from '@/components/UnifiedCard';
import AuthForm from '@/components/AuthForm';
import { UnifiedFilterSection } from '@/components/filters';
import './HomePage.css';

const HomePage = memo(() => {
  // logger.componentMount('HomePage');
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Mode: 'activities' | 'resources'
  const mode = searchParams.get('mode') || 'activities';
  
  // Activity type: 'all' | 'quiz' | 'homework' | 'training' | 'labandproject' (only used when mode === 'activities')
  const [activityType, setActivityType] = useState('all');
  
  // Category filter for activities: '' | 'programming' | 'computing' | 'algorithm' | 'general'
  const [category, setCategory] = useState('');
  
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

  // Navbar collapse state
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('navbarCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Help tour state
  const [runTour, setRunTour] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const filtersRef = useRef(null);
  const gridRef = useRef(null);
  const tourSeenKey = `homePageHelpSeen_${mode}_${activityType}_${category}`;

  // Close announcement modal when switching modes
  useEffect(() => {
    setSelectedAnnouncement(null);
  }, [mode]);

  // Navbar toggle function
  const toggleNavbar = () => {
    const newCollapsed = !isNavbarCollapsed;
    setIsNavbarCollapsed(newCollapsed);
    localStorage.setItem('navbarCollapsed', newCollapsed.toString());
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('navbar:toggle', { 
      detail: { collapsed: newCollapsed } 
    }));
  };
  
  // Data states
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  
  // User data
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [bookmarks, setBookmarks] = useState({ activities: {}, resources: {}, quizzes: {}, announcements: {} });
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
  // Additional status filters
  const [requiresSubmissionFilter, setRequiresSubmissionFilter] = useState(false);
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
    const startTour = () => {
      logger.debug('[HomePage] Launching Joyride tour via app event');
      setRunTour(true);
    };
    // Listen for both legacy help event and the joyride event from Navbar
    window.addEventListener('app:help', startTour);
    window.addEventListener('app:joyride', startTour);
    return () => {
      window.removeEventListener('app:help', startTour);
      window.removeEventListener('app:joyride', startTour);
    };
  }, [mode]);

  // Initialize mode from URL
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode && ['activities', 'resources'].includes(urlMode)) {
      // Mode is already set via searchParams
      // Reset activity type and category when switching to activities
      if (urlMode === 'activities') {
        setActivityType('all');
        setCategory('');
      }
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
        const data = await getUserProfile(user) || {};
        setEnrolledClasses(Array.isArray(data.enrolledClasses) ? data.enrolledClasses : []);
        setUserData(data);
        setBookmarks({
          activities: (data.bookmarks && data.bookmarks.activities) || {},
          resources: (data.bookmarks && data.bookmarks.resources) || {},
          quizzes: (data.bookmarks && data.bookmarks.quizzes) || {},
          announcements: (data.bookmarks && data.bookmarks.announcements) || {}
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
          logger.warn('[Home] permission-denied reading users/', user.uid);
        } else {
          logger.error('[Home] enrollments error:', e);
        }
      }
    };
    loadUserData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesResult, resourcesResult, quizzesResult, announcementsResult, coursesResult, categoriesResult] = await Promise.all([
        getActivities(),
        getResources(),
        getAllQuizzes(),
        getAnnouncements(),
        getCourses(),
        getCategories()
      ]);
      
      if (activitiesResult.success) {
        setActivities(activitiesResult.data || []);
      }
      if (resourcesResult.success) setResources(resourcesResult.data || []);
      if (quizzesResult.success) setQuizzes(quizzesResult.data || []);
      if (announcementsResult.success) setAnnouncements(announcementsResult.data || []);
      if (coursesResult.success) setCourses(coursesResult.data || []);
      if (categoriesResult.success) setCategories(categoriesResult.data || []);
    } catch (error) {
        logger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current items based on mode and activity type
  const getCurrentItems = () => {
    if (mode === 'resources') {
      // Filter resources by category
      return resources.filter(r => 
        category === '' || (r.docId || r.category || 'general') === category
      );
    }
    
    // Handle announcements mode
    if (mode === 'announcements') {
      return announcements;
    }
    
    // Handle activities mode with activity type and category filtering
    if (mode === 'activities') {
      let filtered = [];
      
      if (activityType === 'quiz') {
        // Show quizzes when activity type is quiz, filtered by category
        filtered = quizzes.filter(q => 
          (category === '' || (q.course || 'general') === category)
        );
      } else if (activityType === 'all') {
        // Show all activities when activity type is all, filtered by category
        filtered = activities.filter(a => 
          a.show !== false && 
          (!a.classId || enrolledClasses.includes(a.classId)) &&
          (category === '' || (a.course || 'general') === category)
        );
      } else {
        // Show filtered activities by type (homework, training, labandproject), also filtered by category
        filtered = activities.filter(a => 
          a.type === activityType && 
          a.show !== false && 
          (!a.classId || enrolledClasses.includes(a.classId)) &&
          (category === '' || (a.course || 'general') === category)
        );
      }
      
      return filtered;
    }
    
    return [];
  };

  // Filter items based on mode and filters
  const filteredItems = useMemo(() => {
    const items = getCurrentItems();
    let filtered = [...items];

    // Common: Search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item => {
        // Handle quizzes in activities mode
        if (mode === 'activities' && activityType === 'quiz') {
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
        if (mode === 'announcements') {
          const titleEn = (item.title_en || item.title || '').toLowerCase();
          const titleAr = (item.title_ar || '').toLowerCase();
          const descEn = (item.message_en || item.message || item.description_en || item.description || '').toLowerCase();
          const descAr = (item.message_ar || item.message || item.description_ar || item.description || '').toLowerCase();
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
        // Handle quizzes in activities mode
        if (mode === 'activities' && activityType === 'quiz') {
          return !!bookmarks.quizzes[id];
        }
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
          if (activityType === 'quiz') {
            // Quizzes - check submissions (TODO: implement quiz completion check)
            return false;
          } else {
            // Activities
            return submissions[id]?.status === SUBMISSION_STATUS.GRADED;
          }
        }
        return false;
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
        let isCompleted = false;
        
        if (mode === 'resources') {
          isCompleted = userProgress[id]?.completed;
        } else if (mode === 'activities') {
          if (activityType === 'quiz') {
            // Quizzes - TODO: implement quiz completion check
            isCompleted = false;
          } else {
            // Activities
            isCompleted = submissions[id]?.status === SUBMISSION_STATUS.GRADED;
          }
        }
        
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
          if (activityType === 'quiz') {
            // Quizzes are always pending until taken
            return true;
          } else {
            // Activities
            return !submissions[id] || submissions[id]?.status !== SUBMISSION_STATUS.GRADED;
          }
        }
        return true;
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
        return submissions[id]?.status === SUBMISSION_STATUS.GRADED;
      });
    } else if (gradedFilter === 'not_graded') {
      filtered = filtered.filter(item => {
        const id = item.docId || item.id;
        return !submissions[id] || submissions[id]?.status !== SUBMISSION_STATUS.GRADED;
      });
    }

    // Mode-specific filters (remove activity type filter since it's now handled by tabs)
    if (mode === 'resources' && resourceTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === resourceTypeFilter);
    }

    if (mode === 'activities' && activityType === 'quiz' && classFilter !== 'all') {
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
    mode, activityType, category, activities, resources, quizzes, searchTerm, bookmarkFilter, difficultyFilter,
    completedFilter, requiredFilter, optionalFilter, overdueFilter, pendingFilter,
    retakableFilter, featuredFilter, gradedFilter, resourceTypeFilter,
    classFilter, bookmarks, userProgress, submissions, enrolledClasses
  ]);

  // Get available classes for quiz filter
  const availableClasses = useMemo(() => {
    if (!(mode === 'activities' && activityType === 'quiz')) return [];
    const classes = new Set();
    quizzes.forEach(q => {
      if (q.classId) classes.add(q.classId);
      if (q.className) classes.add(q.className);
    });
    return Array.from(classes);
  }, [mode, activityType, quizzes]);

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
      if (activityType === 'quiz') {
        // Quiz stats
        const totalCount = items.length;
        const featuredCount = items.filter(q => q.featured).length;
        const retakableCount = items.filter(q => !!(q.allowRetake || q.retakeAllowed)).length;
        // For quizzes, we can't easily determine completion without quiz submissions
        return {
          total: totalCount,
          featured: featuredCount,
          retakable: retakableCount
        };
      } else {
        // Activities stats
        const completedCount = items.filter(a => {
          const aid = a.docId || a.id;
          return submissions[aid]?.status === SUBMISSION_STATUS.GRADED;
        }).length;
        const pendingCount = items.filter(a => {
          const aid = a.docId || a.id;
          return !submissions[aid] || submissions[aid]?.status !== SUBMISSION_STATUS.GRADED;
        }).length;
        const overdueCount = items.filter(a => {
          if (!a.dueDate) return false;
          const dueDate = a.dueDate?.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
          const aid = a.docId || a.id;
          return dueDate < now && submissions[aid]?.status !== SUBMISSION_STATUS.GRADED;
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
      }
    }
    return null;
  }, [mode, activityType, category, activities, resources, quizzes, userProgress, submissions, enrolledClasses]);

  // Calculate filter counts using the hook
  const filterCounts = useFilterCounts(getCurrentItems(), {
    mode,
    activityType,
    userProgress,
    submissions
  });

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
          quizzes: next.quizzes,
          announcements: next.announcements
        }
      }, { merge: true });
    } catch (e) {
      logger.error('Failed to update bookmark:', e);
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
      logger.error('Error updating progress:', error);
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
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} fancyVariant="dots" />;
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
    <div className="home-page" data-theme={theme} style={{ padding: '0rem 0', position: 'relative' }}>
      {loading && <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} fancyVariant="dots" />}
      <div className="content-section" style={{ position: 'relative' }}>
        {/* Mode Switcher - Using Tabs component */}
        <div data-tour="mode-switcher" style={{ marginBottom: '0.15rem' }}>
          <Tabs
            tabs={[
              {
                value: 'activities',
                label: t('activities') || 'Activities',
                icon: mode === 'activities' ? getIconWithColor('ui', 'clipboard_list', 16, '#ffffff') : getIconWithColor('ui', 'clipboard_list', 16, primaryColor),
                badge: mode === 'activities' ? filteredItems.length : undefined
              },
              {
                value: 'resources',
                label: t('resources') || 'Resources',
                icon: mode === 'resources' ? getIconWithColor('ui', 'book_open', 16, '#ffffff') : getIconWithColor('ui', 'book_open', 16, primaryColor),
                badge: mode === 'resources' ? filteredItems.length : undefined
              },
              {
                value: 'announcements',
                label: t('announcements') || 'Announcements',
                icon: mode === 'announcements' ? getIconWithColor('ui', 'megaphone', 16, '#ffffff') : getIconWithColor('ui', 'megaphone', 16, primaryColor),
                badge: mode === 'announcements' ? announcements.length : undefined
              }
            ]}
            activeTab={mode}
            onTabChange={handleModeChange}
            variant="default"
          />
        </div>

        {/* Activity Type Tabs (only for activities mode) - Second row */}
        {mode === 'activities' && (
          <div data-tour="activity-type-tabs" style={{ marginBottom: '0.15rem' }}>
            <Tabs
              tabs={[
                {
                  value: 'all',
                  label: lang === 'en' ? 'All' : 'الكل',
                  icon: activityType === 'all' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor),
                  badge: activityType === 'all' ? filteredItems.length : undefined
                },
                {
                  value: 'quiz',
                  label: lang === 'en' ? 'Quiz' : 'اختبار',
                  icon: activityType === 'quiz' ? getIconWithColor('ui', getActivityTypeConfig('quiz', theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig('quiz', theme, lang).icon, 16, primaryColor),
                  badge: activityType === 'quiz' ? filteredItems.length : undefined
                },
                {
                  value: 'homework',
                  label: lang === 'en' ? 'Homework' : 'واجب',
                  icon: activityType === 'homework' ? getIconWithColor('ui', getActivityTypeConfig('homework', theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig('homework', theme, lang).icon, 16, primaryColor),
                  badge: activityType === 'homework' ? filteredItems.length : undefined
                },
                {
                  value: 'training',
                  label: lang === 'en' ? 'Training' : 'تدريب',
                  icon: activityType === 'training' ? getIconWithColor('ui', getActivityTypeConfig('training', theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig('training', theme, lang).icon, 16, primaryColor),
                  badge: activityType === 'training' ? filteredItems.length : undefined
                },
                {
                  value: 'labandproject',
                  label: lang === 'en' ? 'Lab & Project' : 'معمل ومشروع',
                  icon: activityType === 'labandproject' ? getIconWithColor('ui', getActivityTypeConfig('labandproject', theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig('labandproject', theme, lang).icon, 16, primaryColor),
                  badge: activityType === 'labandproject' ? filteredItems.length : undefined
                }
              ]}
              activeTab={activityType}
              onTabChange={setActivityType}
              variant="default"
            />
          </div>
        )}

        {/* Category Tabs (only for activities mode) - Third row */}
        {mode === 'activities' && (
          <div data-tour="category-tabs" style={{ marginBottom: '0.15rem' }}>
            <Tabs
              tabs={[
                {
                  value: '',
                  label: lang === 'en' ? 'All' : 'الكل',
                  icon: category === '' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor),
                  badge: category === '' ? filteredItems.length : undefined
                },
                ...(categories.length ? categories.map(c => {
                  // Count activities that match current filters (not all activities)
                  const categoryActivities = filteredItems.filter(a => (a.course || 'general') === (c.docId || c.id));
                  return {
                    value: c.docId || c.id,
                    label: lang === 'ar' ? (c.name_ar || c.name_en || c.docId || c.id) : (c.name_en || c.name_ar || c.docId || c.id),
                    icon: category === (c.docId || c.id) ? getIconWithColor('ui', c.icon?.toLowerCase() || 'folder', 16, '#ffffff') : getIconWithColor('ui', c.icon?.toLowerCase() || 'folder', 16, primaryColor),
                    badge: categoryActivities.length
                  };
                }) : [])
              ]}
              activeTab={category}
              onTabChange={setCategory}
              variant="default"
            />
          </div>
        )}

        {/* Category Tabs (only for resources mode) - Third row */}
        {mode === 'resources' && (
          <div data-tour="category-tabs" style={{ marginBottom: '0.15rem' }}>
            <Tabs
              tabs={[
                {
                  value: '',
                  label: lang === 'en' ? 'All' : 'الكل',
                  icon: category === '' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor),
                  badge: category === '' ? filteredItems.length : undefined
                },
                ...(categories.length ? categories.map(c => {
                  // Count resources that match current filters
                  const categoryResources = filteredItems.filter(r => (r.course || 'general') === (c.docId || c.id));
                  return {
                    value: c.docId || c.id,
                    label: lang === 'ar' ? (c.name_ar || c.name_en || c.docId || c.id) : (c.name_en || c.name_ar || c.docId || c.id),
                    icon: category === (c.docId || c.id) ? getIconWithColor('ui', c.icon?.toLowerCase() || 'folder', 16, '#ffffff') : getIconWithColor('ui', c.icon?.toLowerCase() || 'folder', 16, primaryColor),
                    badge: categoryResources.length
                  };
                }) : [])
              ]}
              activeTab={category}
              onTabChange={setCategory}
              variant="default"
            />
          </div>
        )}

        {/* Unified Filters Section */}
        <div ref={filtersRef} data-tour="filters">
          <UnifiedFilterSection
            stats={stats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder={
              mode === 'resources' ? (t('search_resources') || 'Search resources...') :
              (mode === 'activities' && activityType === 'quiz') ? (t('search_quizzes') || 'Search quizzes...') :
              (t('search_activities') || 'Search activities...')
            }
            completedFilter={completedFilter}
            setCompletedFilter={setCompletedFilter}
            completedCount={filterCounts.completedCount}
            pendingFilter={pendingFilter}
            setPendingFilter={setPendingFilter}
            pendingCount={filterCounts.pendingCount}
            requiredFilter={requiredFilter}
            setRequiredFilter={setRequiredFilter}
            requiredCount={filterCounts.requiredCount}
            optionalFilter={optionalFilter}
            setOptionalFilter={setOptionalFilter}
            optionalCount={filterCounts.optionalCount}
            overdueFilter={overdueFilter}
            setOverdueFilter={setOverdueFilter}
            overdueCount={filterCounts.overdueCount}
            // Additional status filters
            requiresSubmissionFilter={requiresSubmissionFilter}
            setRequiresSubmissionFilter={setRequiresSubmissionFilter}
            requiresSubmissionCount={filterCounts.requiresSubmissionCount}
            difficultyFilter={difficultyFilter}
            setDifficultyFilter={setDifficultyFilter}
            bookmarkFilter={bookmarkFilter}
            setBookmarkFilter={setBookmarkFilter}
            featuredFilter={featuredFilter}
            setFeaturedFilter={setFeaturedFilter}
            retakableFilter={retakableFilter}
            setRetakableFilter={setRetakableFilter}
            gradedFilter={gradedFilter}
            setGradedFilter={setGradedFilter}
            programs={[]}
            subjects={[]}
            classes={mode === 'activities' && activityType === 'quiz' ? availableClasses.map(cls => ({ name: cls, id: cls })) : []}
            selectedClass={classFilter}
            setSelectedClass={setClassFilter}
            isMinified={isMinified}
            theme={theme}
            lang={lang}
            t={t}
            primaryColor={primaryColor}
            showStatusFilters={mode !== 'announcements'}
            showDifficultyFilters={mode !== 'announcements'}
            showPerformanceFilters={false}
            showToggleFilters={true}
            showHierarchyFilters={mode === 'activities' && activityType === 'quiz'}
            hierarchyConfig={{
              showPrograms: false,
              showSubjects: false,
              showClasses: mode === 'activities' && activityType === 'quiz',
              showStudents: false
            }}
            toggleConfig={{
              showBookmark: true,
              showFeatured: true,
              showRetakable: mode !== 'announcements',
              showGraded: false
            }}
          />
        </div>


        {/* Items Grid */}
              {loading ? (
                <Loading variant="overlay" message={t('loading') || 'Loading...'} fancyVariant="dots" />
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
                  if (activityType === 'quiz') {
                    isBookmarked = !!bookmarks.quizzes[itemId];
                    // TODO: Add quiz completion logic
                  } else {
                    const submission = submissions[itemId];
                    isCompleted = submission?.status === SUBMISSION_STATUS.GRADED;
                    completedAt = submission?.completedAt || submission?.submittedAt;
                    isBookmarked = !!bookmarks.activities[itemId];
                    dueDate = item.dueDate;
                  }
                } else if (mode === "announcements") {
                  isBookmarked = !!bookmarks.announcements[itemId];
                }

                    return (
                      <UnifiedCard
                        key={itemId}
                        flavor={mode === 'activities' && activityType === 'quiz' ? 'quiz' : (mode === 'resources' ? 'resource' : (mode === 'announcements' ? 'announcement' : mode))}
                        item={item}
                        isCompleted={isCompleted}
                        completedAt={completedAt}
                        isBookmarked={isBookmarked}
                        dueDate={dueDate}
                        lang={lang}
                        t={t}
                        primaryColor={primaryColor}
                        onStart={(item) => {
                          if ((mode === 'activities' && activityType === 'quiz')) {
                            window.location.href = `/quiz/${itemId}`;
                          } else if (mode === 'activities') {
                            window.open(`/activity/${itemId}`, '_blank');
                          } else if (mode === 'resources') {
                            // Handle resource start
                            if (item.type === 'link' && item.url) {
                              window.open(item.url, '_blank');
                            } else if (item.type === 'video' && item.url) {
                              window.open(item.url, '_blank');
                            } else {
                              // Handle other resource types
                              logger.log('Start resource:', item);
                            }
                          } else if (mode === 'announcements') {
                            // Show extended announcement view
                            const title = lang === 'ar' ? (item.title_ar || item.title_en || item.title || 'Announcement') : (item.title_en || item.title_ar || item.title || 'Announcement');
                            const message = lang === 'ar' ? (item.message_ar || item.message_en || item.message || item.description || '') : (item.message_en || item.message_ar || item.message || item.description || '');
                            setSelectedAnnouncement(item);
                          }
                        }}
                        onDetails={(item) => {
                          // Handle details view
                          logger.log('Show details for:', item);
                        }}
                        onComplete={(item) => {
                          // Handle resource completion
                          handleResourceComplete(itemId);
                        }}
                        onBookmark={() => {
                          const bookmarkMode = (mode === 'activities' && activityType === 'quiz') ? 'quizzes' : (mode === 'announcements' ? 'announcements' : mode);
                          handleBookmark(itemId, bookmarkMode);
                        }}
                        onFeatured={() => {
                          // Handle featured toggle for announcements
                          if (mode === 'announcements') {
                            // This would typically update the announcement in Firestore
                            // For now, we'll just log it (you can implement the actual Firestore update later)
                            logger.log('Toggle featured for announcement:', itemId);
                          }
                        }}
                      />
                    );
              })
              )}
            </div>
          )}
        </div>
      
      {/* Joyride Help Tour */}
      <JoyrideTour
        run={runTour}
        mode={mode}
        activityType={activityType}
        tourSeenKey={tourSeenKey}
        onTourFinish={() => {
          logger.log('[HomePage] Tour finished/skipped, setting runTour to false');
          setRunTour(false);
        }}
      />

      {/* Announcement Modal */}
      <Modal
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        size="small"
        showCloseButton={true}
        title=""
      >
        {selectedAnnouncement && (
          <div style={{
            fontSize: '1rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
            {lang === 'ar'
              ? (selectedAnnouncement.message_ar || selectedAnnouncement.message_en || selectedAnnouncement.message || selectedAnnouncement.description || '')
              : (selectedAnnouncement.message_en || selectedAnnouncement.message_ar || selectedAnnouncement.message || selectedAnnouncement.description || '')}
          </div>
        )}
        
        {selectedAnnouncement?.createdAt && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            fontSize: '0.875rem',
            color: isDark ? '#9ca3af' : '#6b7280'
          }}>
            Posted: {selectedAnnouncement.createdAt?.seconds 
              ? new Date(selectedAnnouncement.createdAt.seconds * 1000).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')
              : new Date(selectedAnnouncement.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')
            }
          </div>
        )}
      </Modal>
    </div>
  );
});


export default HomePage;



