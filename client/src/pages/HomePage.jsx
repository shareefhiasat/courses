import React, { useEffect, useState, useMemo, useRef, memo, useCallback, useLayoutEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import JoyrideTour from '@ui/JoyrideTour';
import iconTypes from '@constants/iconTypes';
import logger from '@utils/logger';
const { getThemedIcon, getIconWithColor } = iconTypes;
import { useTheme } from '@contexts/ThemeContext';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { Tabs } from '@ui';
import { getActivities, getAnnouncements, getResources } from '@services/business/activityService';
import { getCourses } from '@services/business/courseService';
import { getAllQuizzes } from '@services/business/quizService';
import { getUserSubmissions } from '@services/business/submissionService';
import { getSubmissions } from '@services/business/submissionsService';
import { getUserProfile, updateUserProgress, getUsers } from '@services/business/userService';
import { getCategories } from '@services/business/categoryService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import ProgramsSelect from '@/components/ui/Select/ProgramsSelect';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { formatDateTime } from '@utils/date';
import { SUBMISSION_STATUS, TASK_STATUS, getStatusLabel, MODE_TYPES, RESOURCE_TYPES, RECORD_TYPES } from '@utils/sharedTypes';
import { ACTIVITY_TYPES } from '@constants/activityTypes';
import { DIFFICULTY_TYPES } from '@constants/difficultyTypes';
import { ROLE_STRINGS } from '@utils/userUtils';
import { useFilterCounts } from '@hooks/useFilterCounts';
import { getActivityTypeConfig } from '@constants/activityTypes';
import { getDifficultyConfig } from '@constants/difficultyTypes';
import { getResourceTypeConfig } from '@constants/resourceTypes';
import { Card, CardBody, Modal, EmptyState, Select } from '@ui';
import { useToast } from '@ui';
import UnifiedCard from '@/components/UnifiedCard';
import AuthForm from '@/components/AuthForm';
import { UnifiedFilterSection } from '@/components/filters';
import useBookmarks from '@hooks/useBookmarks';
import './HomePage.css';

const HomePage = memo(() => {
  // logger.componentMount('HomePage');
  const { user, isAdmin, isSuperAdmin, isHR, isInstructor, isStudent, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const { startLoading } = useGlobalLoading();
  const toast = useToast();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Mode: 'activities' | 'resources'
  const mode = searchParams.get('mode') || MODE_TYPES.ACTIVITIES;
  
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

  // Helper function to get localized category name
  const getCategoryLabel = (category) => {
    const name = lang === 'ar' 
      ? (category.nameAr || category.nameEn || category.name || 'Unnamed Category')
      : (category.nameEn || category.nameAr || category.name || 'Unnamed Category');
    
    // Capitalize first letter of each word for English
    if (lang === 'en' && name && name !== 'Unnamed Category') {
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return name;
  };

  const [runTour, setRunTour] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementFullPage, setAnnouncementFullPage] = useState(false);
  const filtersRef = useRef(null);
  const gridRef = useRef(null);
  const tourSeenKey = `homePageHelpSeen_${mode}_${activityType}_${category}`;

  // Close announcement modal when switching modes
  useEffect(() => {
    setSelectedAnnouncement(null);
  }, [mode]);

  // Navbar toggle function
  const toggleNavbar = useCallback(() => {
    const newCollapsed = !isNavbarCollapsed;
    setIsNavbarCollapsed(newCollapsed);
    try {
      localStorage.setItem('navbarCollapsed', newCollapsed.toString());
    } catch (error) {
      logger.warn('Failed to save navbar state to localStorage:', error);
    }
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('navbar:toggle', { 
      detail: { collapsed: newCollapsed } 
    }));
  }, [isNavbarCollapsed]);
  
  // Data states
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  
  // User data
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [userProgress, setUserProgress] = useState({});
  
  // Use the new bookmark hook
  const { 
    bookmarks, 
    bookmarkCounts, 
    loading: bookmarksLoading, 
    toggleBookmark,
    calculateFilterBookmarkCount 
  } = useBookmarks({ enableRealtime: false });
  
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

  // Review mode state
  const [reviewSubmissions, setReviewSubmissions] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewPrograms, setReviewPrograms] = useState([]);
  const [reviewSubjects, setReviewSubjects] = useState([]);
  const [reviewClasses, setReviewClasses] = useState([]);
  const [reviewStudents, setReviewStudents] = useState([]);
  const [reviewActivities, setReviewActivities] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');

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
    if (urlMode && [MODE_TYPES.ACTIVITIES, MODE_TYPES.RESOURCES].includes(urlMode)) {
      // Mode is already set via searchParams
      // Reset activity type and category when switching to activities
      if (urlMode === MODE_TYPES.ACTIVITIES) {
        setActivityType('all');
        setCategory('');
      }
    }
  }, [searchParams]);

  // Load data function (defined before useEffect that uses it)
  const loadData = useCallback(async (stopGlobalLoading) => {
    console.log('[HomePage] loadData called - about to fetch resources');
    try {
      logger.debug('[HomePage] Starting loadData - calling all services...');
      
      const [activitiesResult, resourcesResult, quizzesResult, announcementsResult, coursesResult, categoriesResult] = await Promise.all([
        getActivities().catch(err => {
          console.error('[HomePage] getActivities FAILED:', err);
          console.log('[HomePage] getActivities error details:', err);
          return { success: false, error: err.message, data: [] };
        }),
        getResources().catch(err => {
          console.error('[HomePage] getResources FAILED:', err);
          return { success: false, error: err.message, data: [] };
        }),
        getAllQuizzes(),
        getAnnouncements(),
        getCourses(),
        getCategories()
      ]);

      console.log('[HomePage] Promise.all results:', {
        activitiesSuccess: activitiesResult.success,
        activitiesLength: activitiesResult.data?.length,
        activitiesError: activitiesResult.error,
        resourcesSuccess: resourcesResult.success,
        resourcesLength: resourcesResult.data?.length
      });

      logger.debug('[HomePage] Promise.all completed, checking results...');

      if (activitiesResult.success) {
        setActivities(activitiesResult.data || []);
        // Debug: Log all activity types to see what we have
        const activityTypes = [...new Set(activitiesResult.data.map(a => a.type))];
        logger.debug('[HomePage] Available activity types:', activityTypes);
        logger.debug('[HomePage] All activities data:', activitiesResult.data.map(a => ({
          id: a.docId,
          type: a.type,
          title: a.titleEn || a.title,
          featured: a.featured,
          allowRetake: a.allowRetake,
          settingsAllowRetake: a.settings?.allowRetake,
          level: a.level,
          difficulty: a.difficulty,
          optional: a.optional,
          dueDate: a.dueDate
        })));
        
        // Debug: Check what activity types we're looking for vs what we have
        logger.debug('[HomePage] Looking for activity types:', {
          QUIZ: ACTIVITY_TYPES.QUIZ,
          HOMEWORK: ACTIVITY_TYPES.HOMEWORK, 
          TRAINING: ACTIVITY_TYPES.TRAINING,
          LAB_AND_PROJECT: ACTIVITY_TYPES.LAB_AND_PROJECT
        });
      }
      if (resourcesResult.success) {
        logger.debug('[HomePage] Resources loaded from service:', {
          success: resourcesResult.success,
          dataLength: resourcesResult.data?.length || 0,
          data: resourcesResult.data
        });
        console.log('[HomePage] Resources data received:', resourcesResult.data);
        setResources(resourcesResult.data || []);
      } else {
        logger.warn('[HomePage] Resources service failed:', resourcesResult.error);
        console.log('[HomePage] Resources service failed:', resourcesResult.error);
        setResources([]);
      }
      if (quizzesResult.success) setQuizzes(quizzesResult.data || []);
      if (announcementsResult.success) {
        setAnnouncements(announcementsResult.data || []);
      }
      if (coursesResult.success) setCourses(coursesResult.data || []);
      if (categoriesResult.success) setCategories(categoriesResult.data || []);
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      if (stopGlobalLoading) {
        stopGlobalLoading();
      }
    }
  }, []);

  // Load review mode data (submissions + enrichment)
  const loadReviewData = useCallback(async () => {
    if (!user) return;
    setReviewLoading(true);
    try {
      const [programsRes, subjectsRes, classesRes, activitiesRes, usersRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getActivities(),
        getUsers()
      ]);

      let programsData = programsRes.success ? (programsRes.data || []) : [];
      let subjectsData = subjectsRes.success ? (subjectsRes.data || []) : [];
      let classesData = classesRes.success ? (classesRes.data || []) : [];
      let activitiesData = activitiesRes.success ? (activitiesRes.data || []) : [];
      const usersData = usersRes.success ? (usersRes.data || []) : [];

      const isInstructor = user?.isInstructor || false;
      const isSuperAdmin = user?.isSuperAdmin || false;
      const isAdmin = user?.isAdmin || false;

      if (isInstructor && !isAdmin && !isSuperAdmin) {
        classesData = classesData.filter(c =>
          c.instructorId === user.uid || c.ownerEmail === user.email || c.instructor === user.email
        );
        const accessibleSubjectIds = new Set(classesData.map(c => c.subjectId).filter(Boolean));
        subjectsData = subjectsData.filter(s => accessibleSubjectIds.has(s.docId || s.id));
        const accessibleProgramIds = new Set(subjectsData.map(s => s.programId).filter(Boolean));
        programsData = programsData.filter(p => accessibleProgramIds.has(p.docId || p.id));
        const accessibleClassIds = new Set(classesData.map(c => c.id || c.docId));
        activitiesData = activitiesData.filter(a => !a.classId || accessibleClassIds.has(a.classId));
      }

      setReviewPrograms(programsData);
      setReviewSubjects(subjectsData);
      setReviewClasses(classesData);
      setReviewActivities(activitiesData);
      setReviewStudents(usersData.filter(u => u.isStudent));

      const submissionsResult = await getSubmissions();
      let submissionsData = submissionsResult.success ? submissionsResult.data : [];

      const enriched = submissionsData.map(sub => {
        const activity = activitiesData.find(a => (a.id || a.docId) === sub.activityId);
        const student = usersData.find(u => (u.id || u.docId || u.uid) === sub.userId);
        const classData = classesData.find(c => (c.id || c.docId) === (sub.classId || activity?.classId));
        const subject = subjectsData.find(s => (s.id || s.docId) === classData?.subjectId);
        const program = programsData.find(p => (p.id || p.docId) === subject?.programId);
        return {
          ...sub,
          id: sub.docId || sub.id,
          activityTitle: activity
            ? (lang === 'ar' ? (activity.titleAr || activity.titleEn) : (activity.titleEn || activity.titleAr))
            : 'N/A',
          activityType: activity?.type || 'unknown',
          difficulty: activity?.difficulty || activity?.level || 'beginner',
          studentName: student?.displayName || student?.email || 'N/A',
          studentEmail: student?.email || null,
          className: classData ? (classData.name || classData.code) : 'N/A',
          subjectName: subject
            ? (lang === 'ar' ? (subject.nameAr || subject.nameEn) : (subject.nameEn || subject.nameAr))
            : 'N/A',
          programName: program
            ? (lang === 'ar' ? (program.nameAr || program.nameEn) : (program.nameEn || program.nameAr))
            : 'N/A',
          classId: sub.classId || activity?.classId,
          subjectId: classData?.subjectId,
          programId: subject?.programId,
          activity
        };
      });

      setReviewSubmissions(enriched);
    } catch (error) {
      logger.error('[HomePage] loadReviewData error:', error);
    } finally {
      setReviewLoading(false);
    }
  }, [user, isAdmin, lang]);

  // Trigger review data load when entering review mode
  useEffect(() => {
    if (mode === MODE_TYPES.REVIEW && user && !authLoading) {
      loadReviewData();
    }
  }, [mode, user, authLoading, loadReviewData]);

  // Load user data with global loading to prevent flicker
  useLayoutEffect(() => {
    logger.debug('[HomePage] useLayoutEffect running:', { authLoading, user: !!user });
    
    if (authLoading) return;
    if (!user) {
      logger.debug('[HomePage] No user, clearing all data');
      setActivities([]);
      setResources([]);
      setQuizzes([]);
      setAnnouncements([]);
      setCourses([]);
      return;
    }

    logger.debug('[HomePage] User exists, calling loadData');
    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    loadData(safeStop);

    return () => {
      safeStop();
    };
  }, [authLoading, user, loadData, startLoading]);

  // Load user enrollments and progress (bookmarks are now handled by useBookmarks hook)
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const data = await getUserProfile(user) || {};
        setEnrolledClasses(Array.isArray(data.enrolledClasses) ? data.enrolledClasses : []);
        setUserData(data);
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

  // Get current items based on mode and activity type
  const getCurrentItems = useCallback(() => {
    // Helper function to check if user can access item based on class
    const canUserAccessItem = (item) => {
      // Admin, SuperAdmin, and HR roles can see all items
      if (isAdmin || isSuperAdmin || isHR) {
        console.log('[HomePage] canUserAccessItem - Super admin bypass for item:', item.docId);
        return true;
      }
      
      // Instructors can see items from their enrolled classes
      if (isInstructor) {
        return enrolledClasses.includes(item.classId);
      }
      
      // Students can only see items from their enrolled classes
      if (isStudent) {
        return enrolledClasses.includes(item.classId);
      }
      
      // Default: deny access if no role flags are set
      return false;
    };
    
    if (mode === MODE_TYPES.RESOURCES) {
      // Filter resources by category and class access
      const filteredResources = resources.filter(r => 
        (category === '' || (r.category || '') === category) &&
        canUserAccessItem(r)
      );
      console.log('[HomePage] Resources filtering:', {
        totalResources: resources.length,
        category,
        filteredCount: filteredResources.length,
        resourcesSample: resources.slice(0, 3),
        isAdmin: user?.isAdmin || false,
        enrolledClasses,
        canAccessSample: resources.slice(0, 3).map(r => ({
          id: r.docId || r.id,
          title: r.titleEn || r.title,
          classId: r.classId,
          category: r.category,
          categoryCheck: (r.category || '') === category,
          canAccess: canUserAccessItem(r)
        }))
      });
      return filteredResources;
    }
    
    // Handle announcements mode
    if (mode === MODE_TYPES.ANNOUNCEMENTS) {
      return announcements.filter(canUserAccessItem);
    }
    
    // Handle activities mode with activity type and category filtering
    if (mode === MODE_TYPES.ACTIVITIES) {
      console.log('[HomePage] Activities filtering - AuthContext flags:', {
        isAdmin: isAdmin,
        isSuperAdmin: isSuperAdmin,
        isHR: isHR,
        isInstructor: isInstructor,
        isStudent: isStudent,
        userRole: user?.role
      });
      console.log('[HomePage] Activities filtering - Raw activities data:', activities.map(a => ({
        id: a.docId,
        type: a.type,
        show: a.show,
        classId: a.classId,
        course: a.course
      })));
      
      let filtered = [];
      
      if (activityType === ACTIVITY_TYPES.QUIZ) {
        // Show activities that have type 'quiz' (not from separate quizzes collection)
        filtered = activities.filter(a => 
          a.type === ACTIVITY_TYPES.QUIZ &&
          a.show !== false && 
          canUserAccessItem(a) &&
          (category === '' || (a.course || 'general') === category)
        );
      } else if (activityType === 'all') {
        // Show all activities when activity type is all, filtered by category
        filtered = activities.filter(a => 
          a.show !== false && 
          canUserAccessItem(a) &&
          (category === '' || (a.course || 'general') === category)
        );
      } else {
        // For other activity types (training, homework, labandproject), show all activities if specific type is empty
        const specificTypeActivities = activities.filter(a => 
          a.type === activityType && 
          a.show !== false && 
          canUserAccessItem(a) &&
          (category === '' || (a.course || 'general') === category)
        );
        
        // If no activities of this specific type, show all activities
        if (specificTypeActivities.length === 0) {
          filtered = activities.filter(a => 
            a.show !== false && 
            canUserAccessItem(a) &&
            (category === '' || (a.course || 'general') === category)
          );
        } else {
          filtered = specificTypeActivities;
        }
      }
      
      return filtered;
    }
    
    return [];
  }, [mode, activityType, category, activities, resources, quizzes, announcements, enrolledClasses, user]);

  // Debug: Log when resources state changes
  useEffect(() => {
    console.log('[HomePage] Resources state updated:', {
      resourcesLength: resources.length,
      resourcesSample: resources.slice(0, 2),
      mode
    });
  }, [resources, mode]);

  // Filter items based on mode and filters
  const filteredItems = useMemo(() => {
    const items = getCurrentItems();
    let filtered = [...items];

    console.log('[HomePage] FILTERING START:', {
      mode,
      activityType,
      category,
      searchTerm: `'${searchTerm}'`,
      bookmarkFilter,
      difficultyFilter,
      completedFilter,
      requiredFilter,
      optionalFilter,
      overdueFilter,
      pendingFilter,
      retakableFilter,
      featuredFilter,
      gradedFilter,
      resourceTypeFilter,
      classFilter,
      getCurrentItemsLength: items.length,
      initialFilteredLength: filtered.length,
      itemsSample: items.slice(0, 3).map(item => ({
        id: item.docId || item.id,
        title: item.titleEn || item.title,
        type: item.type,
        classId: item.classId
      }))
    });

    // Common: Search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(item => {
        // Handle quizzes in activities mode
        if (mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ) {
          const titleEn = (item.titleEn || item.title || '').toLowerCase();
          const titleAr = (item.titleAr || '').toLowerCase();
          const descEn = (item.descriptionEn || item.description || '').toLowerCase();
          const descAr = (item.descriptionAr || '').toLowerCase();
          return titleEn.includes(q) || titleAr.includes(q) || descEn.includes(q) || descAr.includes(q);
        }
        if (mode === MODE_TYPES.RESOURCES) {
          const titleEn = (item.titleEn || item.title || '').toLowerCase();
          const titleAr = (item.titleAr || '').toLowerCase();
          const descEn = (item.descriptionEn || item.description || '').toLowerCase();
          const descAr = (item.descriptionAr || '').toLowerCase();
          return titleEn.includes(q) || titleAr.includes(q) || descEn.includes(q) || descAr.includes(q);
        }
        if (mode === MODE_TYPES.ANNOUNCEMENTS) {
          const titleEn = (item.titleEn || item.title || '').toLowerCase();
          const titleAr = (item.titleAr || '').toLowerCase();
          const descEn = (item.messageEn || item.message || item.descriptionEn || item.description || '').toLowerCase();
          const descAr = (item.messageAr || item.message || item.descriptionAr || item.description || '').toLowerCase();
          return titleEn.includes(q) || titleAr.includes(q) || descEn.includes(q) || descAr.includes(q);
        }
        // Activities
        const titleEn = (item.titleEn || '').toLowerCase();
        const titleAr = (item.titleAr || '').toLowerCase();
        const descEn = (item.descriptionEn || '').toLowerCase();
        const descAr = (item.descriptionAr || '').toLowerCase();
        return titleEn.includes(q) || titleAr.includes(q) || descEn.includes(q) || descAr.includes(q);
      });
      console.log('[HomePage] AFTER SEARCH FILTER:', { beforeSearch, afterSearch: filtered.length });
    }

    // Common: Bookmark
    if (bookmarkFilter) {
      const beforeBookmark = filtered.length;
      filtered = filtered.filter(item => {
        const id = item.docId || item.id;
        // Handle quizzes in activities mode
        if (mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ) {
          return !!bookmarks.activities[id];
        }
        return !!bookmarks[mode]?.[id];
      });
      console.log('[HomePage] AFTER BOOKMARK FILTER:', { beforeBookmark, afterBookmark: filtered.length });
    }

    // Common: Difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(item => {
        const level = (item.level || item.difficulty || DIFFICULTY_TYPES.BEGINNER).toLowerCase();
        return level === difficultyFilter.toLowerCase();
      });
    }

    // Common: Completed
    if (completedFilter) {
      filtered = filtered.filter(item => {
        const id = item.docId || item.id;
        if (mode === MODE_TYPES.RESOURCES) {
          return userProgress[id]?.completed;
        }
        if (mode === MODE_TYPES.ACTIVITIES) {
          if (activityType === ACTIVITY_TYPES.QUIZ) {
            // Quizzes - check submissions for completion
            const submission = submissions[id];
            return submission?.status === SUBMISSION_STATUS.GRADED;
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
        
        if (mode === MODE_TYPES.RESOURCES) {
          isCompleted = userProgress[id]?.completed;
        } else if (mode === MODE_TYPES.ACTIVITIES) {
          if (activityType === ACTIVITY_TYPES.QUIZ) {
            // Quizzes - check submissions for completion
            const submission = submissions[id];
            isCompleted = submission?.status === SUBMISSION_STATUS.GRADED;
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
        if (mode === MODE_TYPES.RESOURCES) {
          return !userProgress[id]?.completed;
        }
        if (mode === MODE_TYPES.ACTIVITIES) {
          if (activityType === ACTIVITY_TYPES.QUIZ) {
            // Quizzes - check if not completed
            const submission = submissions[id];
            return !submission || submission?.status !== SUBMISSION_STATUS.GRADED;
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

    if (mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ && classFilter !== 'all') {
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

    logger.debug('[HomePage] Final filteredItems result:', {
      finalLength: filtered.length,
      finalItemsSample: filtered.slice(0, 3).map(item => ({
        id: item.docId || item.id,
        title: item.titleEn || item.title,
        type: item.type,
        classId: item.classId
      }))
    });

    return filtered;
  }, [
    mode, activityType, category, searchTerm, bookmarkFilter, difficultyFilter,
    completedFilter, requiredFilter, optionalFilter, overdueFilter, pendingFilter,
    retakableFilter, featuredFilter, gradedFilter, resourceTypeFilter,
    classFilter, bookmarks, userProgress, submissions, enrolledClasses,
    activities, resources, quizzes, announcements
  ]);

  // Calculate resource type counts
  const resourceTypeCounts = useMemo(() => {
    if (mode !== MODE_TYPES.RESOURCES) return {};
    
    const counts = {
      [RESOURCE_TYPES.ALL]: resources.length,
      [RESOURCE_TYPES.VIDEO]: 0,
      [RESOURCE_TYPES.LINK]: 0,
      [RESOURCE_TYPES.DOCUMENT]: 0
    };
    
    resources.forEach(resource => {
      const type = resource.type || RESOURCE_TYPES.DOCUMENT;
      if (type === RESOURCE_TYPES.VIDEO) counts[RESOURCE_TYPES.VIDEO]++;
      else if (type === RESOURCE_TYPES.LINK) counts[RESOURCE_TYPES.LINK]++;
      else counts[RESOURCE_TYPES.DOCUMENT]++; // Default to document
    });
    
    return counts;
  }, [mode, resources]);

  // Calculate filter counts for all chips
  const getFilterCounts = () => {
    const counts = {
      bookmark: 0, // Changed from 'bookmarked' to 'bookmark' to match chip ID
      featured: 0,
      retakable: 0,
      completed: 0,
      required: 0,
      optional: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0
    };
    
    // Only count items relevant to current mode/activityType
    let itemsToCount = [];
    
    if (mode === MODE_TYPES.ACTIVITIES) {
      if (activityType === ACTIVITY_TYPES.QUIZ) {
        itemsToCount = activities.filter(a => a.type === ACTIVITY_TYPES.QUIZ);
      } else if (activityType === ACTIVITY_TYPES.HOMEWORK) {
        itemsToCount = activities.filter(a => a.type === ACTIVITY_TYPES.HOMEWORK);
      } else if (activityType === ACTIVITY_TYPES.TRAINING) {
        itemsToCount = activities.filter(a => a.type === ACTIVITY_TYPES.TRAINING);
      } else if (activityType === ACTIVITY_TYPES.LAB_AND_PROJECT) {
        itemsToCount = activities.filter(a => a.type === ACTIVITY_TYPES.LAB_AND_PROJECT);
      } else {
        itemsToCount = activities;
      }
      
      // Debug: Log what we're counting for each activity type
      if (activityType === ACTIVITY_TYPES.TRAINING || activityType === ACTIVITY_TYPES.LAB_AND_PROJECT) {
        logger.debug(`[HomePage] ${activityType} items to count:`, {
          activityType,
          totalItems: itemsToCount.length,
          items: itemsToCount.map(item => ({
            id: item.docId,
            type: item.type,
            featured: item.featured,
            allowRetake: item.allowRetake,
            settingsAllowRetake: item.settings?.allowRetake,
            level: item.level,
            difficulty: item.difficulty
          }))
        });
      }
    } else if (mode === MODE_TYPES.RESOURCES) {
      itemsToCount = resources;
    } else if (mode === MODE_TYPES.ANNOUNCEMENTS) {
      itemsToCount = announcements;
    }
    
    // Use the new bookmark counting function
    counts.bookmark = calculateFilterBookmarkCount(itemsToCount, mode, activityType);
    
    // Debug logging
    logger.debug('[HomePage] Calculating filter counts:', {
      mode,
      activityType,
      itemsToCount: itemsToCount.length,
      bookmarkCount: counts.bookmark,
      bookmarkCounts
    });
    
    itemsToCount.forEach(item => {
      // Featured counts
      if (item.featured) counts.featured++;
      
      // Retakable counts (for quizzes and activities)
      if (item.allowRetake || item.settings?.allowRetake) counts.retakable++;
      
      // Completed counts
      if (userProgress[item.docId || item.id]?.completed) counts.completed++;
      
      // Required/Optional counts (for activities only)
      if (mode === MODE_TYPES.ACTIVITIES) {
        if (item.optional === false) counts.required++;
        else if (item.optional === true) counts.optional++;
      }
      
      // Difficulty counts (for activities and quizzes)
      if (item.difficulty === 'beginner') counts.beginner++;
      else if (item.difficulty === 'intermediate') counts.intermediate++;
      else if (item.difficulty === 'advanced') counts.advanced++;
    });
    
    // Debug final counts
    logger.debug('[HomePage] Final filter counts:', counts);
    
    return counts;
  };

  const availableClasses = useMemo(() => {
    if (!(mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ)) return [];
    const classes = new Set();
    activities.filter(a => a.type === ACTIVITY_TYPES.QUIZ).forEach(quiz => {
      if (quiz.classId) classes.add(quiz.classId);
      if (quiz.className) classes.add(quiz.className);
    });
    return Array.from(classes);
  }, [mode, activityType, activities]);

  // Calculate counts for each mode
  const modeCounts = useMemo(() => {
    // Helper function to check if user can access item based on class
    const canUserAccessItem = (item) => {
      // Admin, SuperAdmin, and HR roles can see all items
      if (isAdmin || isSuperAdmin || isHR) return true;
      
      // Instructors and students can only see items from their enrolled classes
      if (isInstructor || isStudent) {
        return enrolledClasses.includes(item.classId);
      }
      
      // Default: deny access
      return false;
    };
    
    // Calculate activities count with class-based filtering
    const activitiesCount = activities.filter(a => 
      a.show !== false && 
      canUserAccessItem(a) &&
      (category === '' || (a.course || 'general') === category)
    ).length;
    
    // Calculate resources count with class-based filtering
    const resourcesCount = resources.filter(canUserAccessItem).length;
    
    // Calculate announcements count with class-based filtering
    const announcementsCount = announcements.filter(canUserAccessItem).length;
    
    // Debug logging for resources
    logger.debug('[HomePage] Mode counts debug:', {
      isAdmin,
      enrolledClasses,
      totalResources: resources.length,
      filteredResources: resourcesCount,
      resourcesSample: resources.slice(0, 3).map(r => ({
        id: r.docId || r.id,
        title: r.titleEn || r.title,
        classId: r.classId,
        canAccess: canUserAccessItem(r)
      }))
    });
    
    return {
      activities: activitiesCount,
      resources: resourcesCount,
      announcements: announcementsCount
    };
  }, [activities, resources, announcements, enrolledClasses, category, user]);

  // Calculate counts for each activity type
  const activityTypeCounts = useMemo(() => {
    const allActivities = activities.filter(a => 
      a.show !== false && 
      (!a.classId || enrolledClasses.includes(a.classId))
    );
    
    const quizActivities = allActivities.filter(a => a.type === ACTIVITY_TYPES.QUIZ);
    const homeworkActivities = allActivities.filter(a => a.type === ACTIVITY_TYPES.HOMEWORK);
    const trainingActivities = allActivities.filter(a => a.type === ACTIVITY_TYPES.TRAINING);
    const labProjectActivities = allActivities.filter(a => a.type === ACTIVITY_TYPES.LAB_AND_PROJECT);
    
    return {
      all: allActivities.length,
      quiz: quizActivities.length,
      homework: homeworkActivities.length,
      training: trainingActivities.length,
      labandproject: labProjectActivities.length
    };
  }, [activities, enrolledClasses]);

  // Calculate filter counts using the hook - use activity-specific items for proper counts
  const hookFilterCounts = useFilterCounts(
    mode === MODE_TYPES.ACTIVITIES && activityType !== 'all' 
      ? (() => {
          const specificTypeActivities = activities.filter(a => 
            a.type === activityType && 
            a.show !== false && 
            (!a.classId || enrolledClasses.includes(a.classId))
          );
          
          // If no activities of this specific type, use all activities
          return specificTypeActivities.length === 0 
            ? activities.filter(a => 
                a.show !== false && 
                (!a.classId || enrolledClasses.includes(a.classId))
              )
            : specificTypeActivities;
        })()
      : getCurrentItems(),
    {
      mode,
      activityType,
      userProgress,
      submissions,
      bookmarks // Add bookmarks to the hook
    }
  );

  // Calculate comprehensive stats using the same hook as ReviewResultsPage
  const stats = useMemo(() => {
    return {
      // Map filterCounts to StatsBar expected format
      completed: hookFilterCounts.completedCount,
      pending: hookFilterCounts.pendingCount,
      required: hookFilterCounts.requiredCount,
      optional: hookFilterCounts.optionalCount,
      overdue: hookFilterCounts.overdueCount,
      requiresSubmission: hookFilterCounts.requiresSubmissionCount,
      bookmark: hookFilterCounts.bookmark,
      featured: hookFilterCounts.featured,
      retakable: hookFilterCounts.retakable,
      // Additional stats for specific modes
      total: getCurrentItems().length
    };
  }, [hookFilterCounts, getCurrentItems]);

  // Debug logging to see what the hook returns
  logger.debug('[HomePage] Hook filter counts:', {
    hookFilterCounts,
    bookmarkCount: hookFilterCounts.bookmark,
    mode,
    activityType,
    bookmarksAvailable: Object.keys(bookmarks).length
  });

  // Remove manual filterCounts since we're using the hook
  // const filterCounts = getFilterCounts();

  // Review mode: derive available years and terms from submissions
  const reviewAvailableYears = useMemo(() => {
    const years = new Set();
    reviewSubmissions.forEach(sub => {
      const year = sub.year || sub.academicYear;
      if (year) years.add(String(year));
    });
    return Array.from(years).sort();
  }, [reviewSubmissions]);

  const reviewAvailableTerms = useMemo(() => {
    const terms = new Set();
    reviewSubmissions.forEach(sub => {
      const term = sub.term || sub.semester;
      if (term) terms.add(term);
    });
    return Array.from(terms);
  }, [reviewSubmissions]);

  // Review mode: filtered items with role-based scoping + all active filters
  const filteredReviewItems = useMemo(() => {
    if (mode !== MODE_TYPES.REVIEW) return [];

    const isStudent = user?.isStudent || false;
    const isInstructor = user?.isInstructor || false;
    const isSuperAdmin = user?.isSuperAdmin || false;

    // Instructor classes for scoping
    const instructorClassIds = new Set(reviewClasses.map(c => c.id || c.docId));
    const instructorStudentIds = new Set(
      reviewStudents
        .filter(s => s.enrolledClasses?.some(cid => instructorClassIds.has(cid)))
        .map(s => s.uid)
    );

    // Start from enriched submissions
    let filtered = [...reviewSubmissions];

    // Role-based scoping
    if (isStudent) {
      filtered = filtered.filter(sub => sub.userId === user.uid || sub.studentId === user.uid);
    } else if (isInstructor && !isSuperAdmin) {
      filtered = filtered.filter(sub =>
        instructorClassIds.has(sub.classId) || instructorStudentIds.has(sub.userId)
      );
    }
    // Admin / HR / Super Admin see all

    // Activity type filter (reuse activityType tab state)
    if (activityType !== 'all') {
      filtered = filtered.filter(sub => sub.activityType === activityType);
    }

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(sub =>
        (sub.activityTitle || '').toLowerCase().includes(q) ||
        (sub.studentName || '').toLowerCase().includes(q) ||
        (sub.studentEmail || '').toLowerCase().includes(q) ||
        (sub.programName || '').toLowerCase().includes(q) ||
        (sub.subjectName || '').toLowerCase().includes(q) ||
        (sub.className || '').toLowerCase().includes(q)
      );
    }

    // Program / Subject / Class hierarchy filters
    if (selectedProgram && selectedProgram !== 'all') {
      filtered = filtered.filter(sub => sub.programId === selectedProgram);
    }
    if (selectedSubject && selectedSubject !== 'all') {
      filtered = filtered.filter(sub => sub.subjectId === selectedSubject);
    }
    if (selectedClass && selectedClass !== 'all') {
      filtered = filtered.filter(sub => sub.classId === selectedClass);
    }

    // Student filter (non-student roles only)
    if (!isStudent && selectedStudent && selectedStudent !== 'all') {
      filtered = filtered.filter(sub => sub.userId === selectedStudent || sub.studentId === selectedStudent);
    }

    // Year / Term filters
    if (selectedYear && selectedYear !== 'all') {
      filtered = filtered.filter(sub => String(sub.year || sub.academicYear) === selectedYear);
    }
    if (selectedTerm && selectedTerm !== 'all') {
      filtered = filtered.filter(sub => (sub.term || sub.semester) === selectedTerm);
    }

    // Difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(sub => (sub.difficulty || '').toLowerCase() === difficultyFilter.toLowerCase());
    }

    // Status filters
    if (completedFilter) {
      filtered = filtered.filter(sub => sub.status === 'graded' || sub.status === 'completed');
    }
    if (pendingFilter) {
      filtered = filtered.filter(sub => !sub.status || sub.status === 'pending');
    }
    if (requiredFilter) {
      filtered = filtered.filter(sub => sub.activity?.optional === false);
    }
    if (optionalFilter) {
      filtered = filtered.filter(sub => sub.activity?.optional === true);
    }
    if (overdueFilter) {
      const now = new Date();
      filtered = filtered.filter(sub => {
        if (!sub.activity?.dueDate) return false;
        const dd = sub.activity.dueDate?.seconds
          ? new Date(sub.activity.dueDate.seconds * 1000)
          : new Date(sub.activity.dueDate);
        return dd < now && sub.status !== 'completed';
      });
    }
    if (featuredFilter) {
      filtered = filtered.filter(sub => sub.activity?.featured === true);
    }
    if (retakableFilter) {
      filtered = filtered.filter(sub =>
        sub.activity?.allowRetake === true || sub.activity?.settings?.allowRetake === true
      );
    }
    if (gradedFilter === 'graded') {
      filtered = filtered.filter(sub => sub.status === 'graded');
    } else if (gradedFilter === 'not_graded') {
      filtered = filtered.filter(sub => sub.status !== 'graded');
    }

    // Sort newest first
    filtered.sort((a, b) => {
      const aTime = a.submittedAt?.toDate
        ? a.submittedAt.toDate().getTime()
        : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
      const bTime = b.submittedAt?.toDate
        ? b.submittedAt.toDate().getTime()
        : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
      return bTime - aTime;
    });

    return filtered;
  }, [
    mode, reviewSubmissions, reviewClasses, reviewStudents, user,
    activityType, searchTerm, selectedProgram, selectedSubject, selectedClass,
    selectedStudent, selectedYear, selectedTerm,
    difficultyFilter, completedFilter, pendingFilter, requiredFilter, optionalFilter,
    overdueFilter, featuredFilter, retakableFilter, gradedFilter
  ]);

  // Review mode stats for StatsBar
  const reviewStats = useMemo(() => {
    if (mode !== MODE_TYPES.REVIEW) return {};
    const total = filteredReviewItems.length;
    const passed = filteredReviewItems.filter(sub => {
      const pct = sub.maxScore > 0 ? (sub.score / sub.maxScore) * 100 : 0;
      return pct >= 60;
    }).length;
    const failed = total - passed;
    return { total, passed, failed };
  }, [mode, filteredReviewItems]);

  const handleModeChange = useCallback((newMode) => {
    setSearchParams({ mode: newMode });
  }, [setSearchParams]);

  const handleBookmark = useCallback(async (itemId, itemMode) => {
    const result = await toggleBookmark(itemId, itemMode, {
      bookmarkedAt: Date.now(),
      mode: mode,
      activityType: activityType
    });
    
    if (!result.success) {
      logger.error('[HomePage] Failed to toggle bookmark:', result.error);
    } else {
      logger.debug('[HomePage] Bookmark toggled successfully:', {
        itemId,
        itemMode,
        isBookmarked: result.isBookmarked
      });
    }
  }, [toggleBookmark, mode, activityType]);

  const handleResourceComplete = useCallback(async (resourceId) => {
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
    
    const result = await updateUserProgress(user.uid, newProgress);
    if (!result.success) {
      logger.error('Error updating progress:', result.error);
      setUserProgress(userProgress); // Revert on error
    }
  }, [user, userProgress]);

  // Get primary color from CSS variable
  const primaryColor = useMemo(() => {
    if (typeof window === 'undefined') return '#800020';
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue('--color-primary').trim() || '#800020';
  }, []);

  if (authLoading) {
    return <GlobalLoadingFallback />;
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
      {console.log('[HomePage] RENDERING - mode:', mode, 'filteredItems.length:', filteredItems.length)}
      <div className="content-section" style={{ position: 'relative' }}>
        {/* Mode Switcher - Using Tabs component */}
        <div data-tour="mode-switcher" style={{ marginBottom: '0.05rem' }}>
          <Tabs
            tabs={[
              {
                value: MODE_TYPES.ACTIVITIES,
                label: t('activities') || 'Activities',
                icon: mode === MODE_TYPES.ACTIVITIES ? getIconWithColor('ui', 'clipboard_list', 16, '#ffffff') : getIconWithColor('ui', 'clipboard_list', 16, primaryColor),
                badge: modeCounts.activities
              },
              {
                value: 'resources',
                label: t('resources') || 'Resources',
                icon: mode === 'resources' ? getIconWithColor('ui', 'book_open', 16, '#ffffff') : getIconWithColor('ui', 'book_open', 16, primaryColor),
                badge: modeCounts.resources
              },
              {
                value: MODE_TYPES.ANNOUNCEMENTS,
                label: t('announcements') || 'Announcements',
                icon: mode === MODE_TYPES.ANNOUNCEMENTS ? getIconWithColor('ui', 'megaphone', 16, '#ffffff') : getIconWithColor('ui', 'megaphone', 16, primaryColor),
                badge: modeCounts.announcements
              },
              {
                value: MODE_TYPES.REVIEW,
                label: (t('review_results') || 'Review Results').replace(/\b\w/g, l => l.toUpperCase()),
                icon: mode === MODE_TYPES.REVIEW ? getIconWithColor('ui', 'eye', 16, '#ffffff') : getIconWithColor('ui', 'eye', 16, primaryColor),
                badge: mode === MODE_TYPES.REVIEW ? filteredReviewItems.length : reviewSubmissions.length
              }
            ]}
            activeTab={mode}
            onTabChange={handleModeChange}
            variant="default"
          />
        </div>

        {/* Activity Type Tabs (only for activities mode) - Second row */}
        {mode === MODE_TYPES.ACTIVITIES && (
          <div data-tour="activity-type-tabs" style={{ marginBottom: '0.05rem' }}>
            <Tabs
              tabs={[
                {
                  value: 'all',
                  label: t('all') || (lang === 'en' ? 'All' : 'الكل'),
                  icon: activityType === 'all' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor),
                  badge: activityTypeCounts.all
                },
                {
                  value: ACTIVITY_TYPES.QUIZ,
                  label: t('quiz') || 'Quiz',
                  icon: activityType === ACTIVITY_TYPES.QUIZ ? getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.QUIZ, theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.QUIZ, theme, lang).icon, 16, primaryColor),
                  badge: activityTypeCounts.quiz
                },
                {
                  value: ACTIVITY_TYPES.HOMEWORK,
                  label: t('homework') || 'Homework',
                  icon: activityType === ACTIVITY_TYPES.HOMEWORK ? getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.HOMEWORK, theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.HOMEWORK, theme, lang).icon, 16, primaryColor),
                  badge: activityTypeCounts.homework
                },
                {
                  value: ACTIVITY_TYPES.TRAINING,
                  label: t('training') || 'Training',
                  icon: activityType === ACTIVITY_TYPES.TRAINING ? getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.TRAINING, theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.TRAINING, theme, lang).icon, 16, primaryColor),
                  badge: activityTypeCounts.training
                },
                {
                  value: ACTIVITY_TYPES.LAB_AND_PROJECT,
                  label: (t('lab_and_project') || 'Lab & Project').replace(/\b\w/g, l => l.toUpperCase()),
                  icon: activityType === ACTIVITY_TYPES.LAB_AND_PROJECT ? getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.LAB_AND_PROJECT, theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.LAB_AND_PROJECT, theme, lang).icon, 16, primaryColor),
                  badge: activityTypeCounts.labandproject
                }
              ]}
              activeTab={activityType}
              onTabChange={setActivityType}
              variant="default"
            />
          </div>
        )}

        {/* Category Tabs (only for activities mode) - Third row */}
        {mode === MODE_TYPES.ACTIVITIES && (
          <div data-tour="category-tabs" style={{ marginBottom: '0.05rem' }}>
            <Tabs
              tabs={[
                {
                  value: '',
                  label: lang === 'en' ? 'All' : 'الكل',
                  icon: category === '' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor),
                  badge: filteredItems.length
                },
                ...(categories.length ? categories.map(c => {
                  // Count activities that match current filters (not all activities)
                  const categoryActivities = filteredItems.filter(a => (a.course || 'general') === (c.docId || c.id));
                  return {
                    value: c.docId || c.id,
                    label: getCategoryLabel(c),
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
          <div data-tour="category-tabs" style={{ marginBottom: '0.05rem' }}>
            <Tabs
              tabs={[
                {
                  value: '',
                  label: lang === 'en' ? 'All' : 'الكل',
                  icon: category === '' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor),
                  badge: filteredItems.length
                },
                ...(categories.length ? categories.map(c => {
                  // Count resources that match current filters
                  const categoryResources = filteredItems.filter(r => (r.course || 'general') === (c.docId || c.id));
                  return {
                    value: c.docId || c.id,
                    label: getCategoryLabel(c),
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

        {/* ── REVIEW MODE ─────────────────────────────────────────────── */}
        {mode === MODE_TYPES.REVIEW && (() => {
          const isStudent = user?.isStudent || false;
          const canFilterByStudent = !isStudent;
          return (
            <>
              {/* Activity type sub-tabs for review mode */}
              <div style={{ marginBottom: '0.05rem' }}>
                <Tabs
                  tabs={[
                    { value: 'all', label: lang === 'en' ? 'All' : 'الكل', icon: activityType === 'all' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor) },
                    { value: ACTIVITY_TYPES.QUIZ, label: t('quiz') || 'Quiz', icon: activityType === ACTIVITY_TYPES.QUIZ ? getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.QUIZ, theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.QUIZ, theme, lang).icon, 16, primaryColor) },
                    { value: ACTIVITY_TYPES.HOMEWORK, label: t('homework') || 'Homework', icon: activityType === ACTIVITY_TYPES.HOMEWORK ? getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.HOMEWORK, theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.HOMEWORK, theme, lang).icon, 16, primaryColor) },
                    { value: ACTIVITY_TYPES.TRAINING, label: t('training') || 'Training', icon: activityType === ACTIVITY_TYPES.TRAINING ? getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.TRAINING, theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.TRAINING, theme, lang).icon, 16, primaryColor) },
                    { value: ACTIVITY_TYPES.LAB_AND_PROJECT, label: (t('lab_and_project') || 'Lab & Project').replace(/\b\w/g, l => l.toUpperCase()), icon: activityType === ACTIVITY_TYPES.LAB_AND_PROJECT ? getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.LAB_AND_PROJECT, theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig(ACTIVITY_TYPES.LAB_AND_PROJECT, theme, lang).icon, 16, primaryColor) }
                  ]}
                  activeTab={activityType}
                  onTabChange={setActivityType}
                  variant="default"
                />
              </div>

              {/* ProgramsSelect + Student dropdown row */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '0.75rem', padding: '0.75rem 1rem', background: isDark ? '#1a1a1a' : '#fff', borderRadius: 12, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)', border: isDark ? '1px solid #333' : 'none' }}>
                <ProgramsSelect
                  programs={reviewPrograms}
                  subjects={reviewSubjects}
                  classes={reviewClasses}
                  selectedProgram={selectedProgram}
                  selectedSubject={selectedSubject}
                  selectedClass={selectedClass}
                  onProgramChange={(val) => { setSelectedProgram(val); setSelectedSubject('all'); setSelectedClass('all'); }}
                  onSubjectChange={(val) => { setSelectedSubject(val); setSelectedClass('all'); }}
                  onClassChange={setSelectedClass}
                  showLabels={false}
                  style={{ flex: 1 }}
                  fullWidth
                />
                {canFilterByStudent && (
                  <Select
                    searchable
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    options={[
                      { value: 'all', label: t('all_students') || 'All Students' },
                      ...reviewStudents.map(s => ({
                        value: s.uid || s.id,
                        label: s.displayName || s.email || s.uid
                      }))
                    ]}
                    style={{ flex: 1 }}
                    fullWidth
                    placeholder={t('all_students') || 'All Students'}
                  />
                )}
                {/* Year filter */}
                {reviewAvailableYears.length > 0 && (
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>{t('year') || 'Year'}</div>
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: isDark ? '1px solid #333' : '1px solid #e5e7eb', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#111', fontSize: '0.875rem', outline: 'none' }}>
                      <option value="all">{t('all') || 'All'}</option>
                      {reviewAvailableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                {/* Term filter */}
                {reviewAvailableTerms.length > 0 && (
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>{t('term') || 'Term'}</div>
                    <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: isDark ? '1px solid #333' : '1px solid #e5e7eb', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#111', fontSize: '0.875rem', outline: 'none' }}>
                      <option value="all">{t('all') || 'All'}</option>
                      {reviewAvailableTerms.map(term => <option key={term} value={term}>{term}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Status / difficulty / toggle filter chips (reuse UnifiedFilterSection) */}
              <div ref={filtersRef} data-tour="filters">
                <UnifiedFilterSection
                  stats={reviewStats}
                  filterCounts={{}}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  searchPlaceholder={t('search_results') || 'Search results...'}
                  completedFilter={completedFilter}
                  setCompletedFilter={setCompletedFilter}
                  pendingFilter={pendingFilter}
                  setPendingFilter={setPendingFilter}
                  requiredFilter={requiredFilter}
                  setRequiredFilter={setRequiredFilter}
                  optionalFilter={optionalFilter}
                  setOptionalFilter={setOptionalFilter}
                  overdueFilter={overdueFilter}
                  setOverdueFilter={setOverdueFilter}
                  requiresSubmissionFilter={requiresSubmissionFilter}
                  setRequiresSubmissionFilter={setRequiresSubmissionFilter}
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
                  isMinified={isMinified}
                  theme={theme}
                  lang={lang}
                  t={t}
                  primaryColor={primaryColor}
                  showStatusFilters={true}
                  showDifficultyFilters={true}
                  showToggleFilters={true}
                  showHierarchyFilters={false}
                  toggleConfig={{ showBookmark: false, showFeatured: true, showRetakable: true, showGraded: true }}
                />
              </div>

              {/* Review cards grid */}
              {reviewLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: isDark ? '#9ca3af' : '#666' }}>
                  <p>{t('loading') || 'Loading...'}</p>
                </div>
              ) : filteredReviewItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: isDark ? '#9ca3af' : '#666' }}>
                  <h3>{t('no_results_found') || 'No results found'}</h3>
                  <p>{t('try_adjusting_filters') || 'Try adjusting your filters'}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', marginTop: '1rem' }}>
                  {filteredReviewItems.map(sub => {
                    const pct = sub.maxScore > 0 ? Math.round((sub.score / sub.maxScore) * 100) : null;
                    const scoreColor = pct === null ? '#6b7280' : pct >= 60 ? '#16a34a' : '#dc2626';
                    const scoreBg = pct === null ? (isDark ? '#374151' : '#f3f4f6') : pct >= 60 ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') : (isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2');
                    const activityItem = sub.activity || { title_en: sub.activityTitle, type: sub.activityType, difficulty: sub.difficulty };
                    return (
                      <UnifiedCard
                        key={sub.id}
                        flavor={sub.activityType === ACTIVITY_TYPES.QUIZ ? RECORD_TYPES.QUIZ : RECORD_TYPES.ACTIVITY}
                        item={activityItem}
                        isCompleted={sub.status === 'graded' || sub.status === 'completed'}
                        completedAt={sub.submittedAt || sub.gradedAt}
                        dueDate={sub.activity?.dueDate}
                        lang={lang}
                        t={t}
                        primaryColor={primaryColor}
                        isMinified={isMinified}
                        showStartButton={false}
                        isReviewMode={true}
                        scorePercent={pct}
                        scoreColor={scoreColor}
                        scoreBg={scoreBg}
                        submissionStatus={sub.status}
                        studentName={sub.studentName}
                        onReview={() => {
                          if (sub.activityType === ACTIVITY_TYPES.QUIZ) {
                            navigate(`/quiz-preview/${sub.activityId}?resultId=${sub.id}`);
                          } else {
                            navigate(`/submission/${sub.id}`);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* ── STANDARD MODES (activities / resources / announcements) ── */}
        {mode !== MODE_TYPES.REVIEW && (
          <div style={{ display: 'contents' }}>
        {/* Unified Filters Section */}
        <div ref={filtersRef} data-tour="filters">
          <UnifiedFilterSection
            stats={stats}
            filterCounts={hookFilterCounts}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder={
              mode === 'resources' ? (t('search_resources') || 'Search resources...') :
              (mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ) ? (t('search_quizzes') || 'Search quizzes...') :
              (t('search_activities') || 'Search activities...')
            }
            completedFilter={completedFilter}
            setCompletedFilter={setCompletedFilter}
            pendingFilter={pendingFilter}
            setPendingFilter={setPendingFilter}
            requiredFilter={requiredFilter}
            setRequiredFilter={setRequiredFilter}
            optionalFilter={optionalFilter}
            setOptionalFilter={setOptionalFilter}
            overdueFilter={overdueFilter}
            setOverdueFilter={setOverdueFilter}
            // Additional status filters
            requiresSubmissionFilter={requiresSubmissionFilter}
            setRequiresSubmissionFilter={setRequiresSubmissionFilter}
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
            classes={mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ ? availableClasses.map(cls => ({ name: cls, id: cls })) : []}
            selectedClass={classFilter}
            setSelectedClass={setClassFilter}
            isMinified={isMinified}
            theme={theme}
            lang={lang}
            t={t}
            primaryColor={primaryColor}
            showStatusFilters={mode !== MODE_TYPES.ANNOUNCEMENTS}
            showDifficultyFilters={mode !== MODE_TYPES.ANNOUNCEMENTS}
            showPerformanceFilters={false}
            showToggleFilters={true}
            showHierarchyFilters={mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ}
            hierarchyConfig={{
              showPrograms: false,
              showSubjects: false,
              showClasses: mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ,
              showStudents: false
            }}
            toggleConfig={{
              showBookmark: true,
              showFeatured: true,
              showRetakable: mode !== MODE_TYPES.ANNOUNCEMENTS,
              showGraded: false
            }}
            // Resource type filters
            resourceTypeFilter={mode === 'resources' ? resourceTypeFilter : undefined}
            setResourceTypeFilter={mode === 'resources' ? setResourceTypeFilter : undefined}
            resourceTypes={mode === MODE_TYPES.RESOURCES ? [
              { 
                value: RESOURCE_TYPES.ALL, 
                label: getResourceTypeConfig(RESOURCE_TYPES.ALL, theme, lang).text, 
                count: resourceTypeCounts[RESOURCE_TYPES.ALL] || 0,
                icon: getResourceTypeConfig(RESOURCE_TYPES.ALL, theme, lang).icon
              },
              { 
                value: RESOURCE_TYPES.VIDEO, 
                label: getResourceTypeConfig(RESOURCE_TYPES.VIDEO, theme, lang).text, 
                count: resourceTypeCounts[RESOURCE_TYPES.VIDEO] || 0,
                icon: getResourceTypeConfig(RESOURCE_TYPES.VIDEO, theme, lang).icon
              },
              { 
                value: RESOURCE_TYPES.LINK, 
                label: getResourceTypeConfig(RESOURCE_TYPES.LINK, theme, lang).text, 
                count: resourceTypeCounts[RESOURCE_TYPES.LINK] || 0,
                icon: getResourceTypeConfig(RESOURCE_TYPES.LINK, theme, lang).icon
              },
              { 
                value: RESOURCE_TYPES.DOCUMENT, 
                label: getResourceTypeConfig(RESOURCE_TYPES.DOCUMENT, theme, lang).text, 
                count: resourceTypeCounts[RESOURCE_TYPES.DOCUMENT] || 0,
                icon: getResourceTypeConfig(RESOURCE_TYPES.DOCUMENT, theme, lang).icon
              }
            ] : []}
            // Quiz type filter for activities
            quizFilter={mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ ? 'quiz' : undefined}
            showQuizFilter={mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ}
          />
        </div>


        {/* Items Grid */}
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

                if (mode === MODE_TYPES.RESOURCES) {
                  isCompleted = userProgress[itemId]?.completed || false;
                  completedAt = userProgress[itemId]?.completedAt;
                  isBookmarked = !!bookmarks.resources[itemId];
                  dueDate = item.dueDate;
                } else if (mode === MODE_TYPES.ACTIVITIES) {
                  if (activityType === ACTIVITY_TYPES.QUIZ) {
                    // Quiz activities use activities bookmark logic (not separate quizzes)
                    isBookmarked = !!bookmarks.activities[itemId];
                    // Quiz completion logic - check submissions for quiz completion
                    const submission = submissions[itemId];
                    isCompleted = submission?.status === SUBMISSION_STATUS.GRADED;
                    completedAt = submission?.completedAt || submission?.submittedAt;
                    dueDate = item.dueDate; // Add due date for quizzes
                    
                    // Debug logs for quiz card data
                    logger.debug('[HomePage] Quiz card data:', {
                      itemId,
                      itemTitle: item.titleEn || item.title,
                      featured: item.featured,
                      dueDate: item.dueDate,
                      allowRetake: item.allowRetake,
                      settings: item.settings,
                      settingsAllowRetake: item.settings?.allowRetake,
                      hasSubmission: !!submission,
                      submissionStatus: submission?.status,
                      isCompleted,
                      activityType,
                      mode,
                      // Log all item properties to see what's available
                      allItemProps: Object.keys(item),
                      itemData: item
                    });
                  } else {
                    const submission = submissions[itemId];
                    isCompleted = submission?.status === SUBMISSION_STATUS.GRADED;
                    completedAt = submission?.completedAt || submission?.submittedAt;
                    isBookmarked = !!bookmarks.activities[itemId];
                    dueDate = item.dueDate;
                  }
                } else if (mode === MODE_TYPES.ANNOUNCEMENTS) {
                  isBookmarked = !!bookmarks.announcements[itemId];
                                  }

                    return (
                      <UnifiedCard
                        key={itemId}
                        flavor={mode === MODE_TYPES.ACTIVITIES ? RECORD_TYPES.ACTIVITY : (mode === MODE_TYPES.RESOURCES ? RECORD_TYPES.RESOURCE : (mode === MODE_TYPES.ANNOUNCEMENTS ? RECORD_TYPES.ANNOUNCEMENT : mode))}
                        item={item}
                        isCompleted={isCompleted}
                        completedAt={completedAt}
                        isBookmarked={isBookmarked}
                        dueDate={dueDate}
                        lang={lang}
                        t={t}
                        primaryColor={primaryColor}
                        showStartButton={
                          (mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ) ||
                          (mode === MODE_TYPES.ACTIVITIES) ||
                          (mode === MODE_TYPES.RESOURCES && (item.type === 'link' || item.type === 'video') && item.url) ||
                          (mode === MODE_TYPES.ANNOUNCEMENTS)
                        }
                        onStart={() => {
                          // Debug log when starting a quiz
                          if (mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ) {
                            logger.debug('[HomePage] Starting quiz:', {
                              itemId,
                              itemTitle: item.titleEn || item.title,
                              featured: item.featured,
                              dueDate: item.dueDate,
                              flavor: mode === MODE_TYPES.ACTIVITIES ? RECORD_TYPES.ACTIVITY : (mode === MODE_TYPES.RESOURCES ? RECORD_TYPES.RESOURCE : (mode === MODE_TYPES.ANNOUNCEMENTS ? RECORD_TYPES.ANNOUNCEMENT : mode))
                            });
                          }
                          // Handle start logic based on mode and type
                          if (mode === MODE_TYPES.ACTIVITIES && activityType === ACTIVITY_TYPES.QUIZ) {
                            navigate(`/quiz/${itemId}`);
                          } else if (mode === MODE_TYPES.RESOURCES) {
                            if (item.type === 'link' && item.url) {
                              window.open(item.url, '_blank');
                            } else if (item.type === 'video' && item.url) {
                              window.open(item.url, '_blank');
                            } else {
                              // Handle other resource types
                              logger.info('[HomePage] Resource click:', { itemId, type: item.type });
                            }
                          } else if (mode === MODE_TYPES.ANNOUNCEMENTS) {
                            setSelectedAnnouncement(item);
                            setAnnouncementFullPage(true);
                          } else {
                            // Handle other activity types
                            navigate(`/activity/${itemId}`);
                          }
                        }}
                        onComplete={(item) => {
                          console.log('[UnifiedCard] Complete button clicked:', {
                            flavor,
                            item,
                            isCompleted,
                            itemId: item.docId || item.id
                          });
                          if (mode === MODE_TYPES.RESOURCES) {
                            handleResourceComplete(itemId);
                          } else {
                            // Handle activity completion
                            logger.info('[HomePage] Activity completion:', { itemId, mode, activityType });
                          }
                        }}
                        onBookmark={() => handleBookmark(itemId, mode)}
                      />
                    );
              })
            )}
          </div>
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
      {selectedAnnouncement && (() => {
        // Debug: Log all available content fields
        logger.debug('[HomePage] Announcement modal data:', {
          id: selectedAnnouncement.id,
          title: selectedAnnouncement.title,
          titleEn: selectedAnnouncement.titleEn,
          titleAr: selectedAnnouncement.titleAr,
          content: selectedAnnouncement.content,
          contentAr: selectedAnnouncement.contentAr,
          message: selectedAnnouncement.message,
          messageAr: selectedAnnouncement.messageAr,
          description: selectedAnnouncement.description
        });
        
        const annTitle = lang === 'ar'
          ? (selectedAnnouncement.titleAr || selectedAnnouncement.titleEn || selectedAnnouncement.title || 'No Title')
          : (selectedAnnouncement.titleEn || selectedAnnouncement.titleAr || selectedAnnouncement.title || 'No Title');
        const annContent = lang === 'ar'
          ? (selectedAnnouncement.contentAr || selectedAnnouncement.content || selectedAnnouncement.messageAr || selectedAnnouncement.message || selectedAnnouncement.description || '')
          : (selectedAnnouncement.content || selectedAnnouncement.contentAr || selectedAnnouncement.message || selectedAnnouncement.description || '');
        
        // Better HTML detection
        const isHtml = annContent && (
          annContent.includes('<p>') || 
          annContent.includes('<b>') || 
          annContent.includes('<ul>') || 
          annContent.includes('<h') || 
          annContent.includes('<br') ||
          annContent.includes('<div>') ||
          annContent.includes('<span>')
        );
        
        const isFullPage = !!announcementFullPage;
        
        logger.debug('[HomePage] Modal content detection:', {
          annContent: annContent ? annContent.substring(0, 100) + '...' : 'EMPTY',
          isHtml,
          lang
        });
        return (
          <Modal
            isOpen={true}
            onClose={() => { setSelectedAnnouncement(null); setAnnouncementFullPage(false); }}
            size={isFullPage ? 'large' : 'medium'}
            showCloseButton={true}
            title={annTitle}
            titleStyle={{
              fontSize: '1.125rem',
              fontWeight: '600',
              lineHeight: '1.3',
              padding: '0.75rem 0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setAnnouncementFullPage(p => !p)}
                style={{
                  background: 'none',
                  border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                  borderRadius: 6,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {isFullPage
                  ? (getThemedIcon('ui', 'chevron_up', 14, theme))
                  : (getThemedIcon('ui', 'chevron_down', 14, theme))}
                {isFullPage ? (t('collapse') || 'Collapse') : (t('expand') || 'Expand')}
              </button>
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                lineHeight: '1.7',
                color: isDark ? '#e5e7eb' : '#1f2937',
                direction: lang === 'ar' ? 'rtl' : 'ltr',
                maxHeight: isFullPage ? 'none' : '60vh',
                overflowY: isFullPage ? 'visible' : 'auto',
              }}
            >
              {isHtml
                ? <div dangerouslySetInnerHTML={{ __html: annContent }} />
                : <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{annContent || (t('no_content') || 'No content available.')}</p>
              }
            </div>
            {selectedAnnouncement.createdAt && (
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                fontSize: '0.8rem',
                color: isDark ? '#9ca3af' : '#6b7280'
              }}>
                {t('posted') || 'Posted:'}{' '}
                {selectedAnnouncement.createdAt?.seconds
                  ? new Date(selectedAnnouncement.createdAt.seconds * 1000).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')
                  : new Date(selectedAnnouncement.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
});


export default HomePage;



