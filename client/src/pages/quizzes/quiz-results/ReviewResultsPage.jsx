import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { useSubmissionFilterCounts } from '@hooks/useFilterCounts';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MODE_TYPES } from '@utils/sharedTypes';
import { Container, Card, CardBody, Tabs, Badge } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import iconTypes from '@constants/iconTypes';
const { getThemedIcon, getColoredIcon, getIconWithColor } = iconTypes;
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getActivities } from '@services/business/activityService';
import { getUsers } from '@services/business/userService';
import { getQuizSubmissions } from '@services/business/quizSubmissionsService';
import { getSubmissions } from '@services/business/submissionsService';
import { getCategories } from '@services/business/categoryService';
import { getActivityTypeConfig } from '@constants/activityTypes';
import { formatDateTime } from '@utils/date';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { UnifiedFilterSection } from '@/components/filters';
import './ReviewResultsPage.css';

const ReviewResultsPage = () => {
  const { user, isAdmin, isInstructor, isSuperAdmin, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { startLoading } = useGlobalLoading();
  
  // Use global auth redirect hook
  const { isAuthenticated, authLoading: redirectLoading } = useAuthRedirect({
    requireAuth: true,
    redirectTo: '/login',
    fallbackRedirect: '/'
  });

  // Mode: 'quiz' | 'homework' | 'training' | 'labandproject' | 'activities' | 'resources'
  const [mode, setMode] = useState(searchParams.get('mode') || MODE_TYPES.ACTIVITIES);

  // Update URL when mode changes
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    searchParams.set('mode', newMode);
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Use handleModeChange to avoid unused warning
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode && urlMode !== mode) {
      handleModeChange(urlMode);
    }
  }, [searchParams, mode, handleModeChange]);

  // Activity type: 'all' | 'quiz' | 'homework' | 'training' | 'labandproject' (only used when mode === MODE_TYPES.ACTIVITIES)
  const [activityType, setActivityType] = useState('all');
  
  // Category filter for programs: '' | programId
  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Role-specific data
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [instructorClasses, setInstructorClasses] = useState([]);
  const [instructorStudents, setInstructorStudents] = useState([]);

  // Generate available years and terms from submissions
  const availableYears = useMemo(() => {
    const years = new Set();
    submissions?.forEach(submission => {
      const year = submission.year || submission.academicYear;
      if (year) years.add(String(year));
    });
    return Array.from(years).sort();
  }, [submissions]);

  const availableTerms = useMemo(() => {
    const terms = new Set();
    submissions?.forEach(submission => {
      const term = submission.term || submission.semester;
      if (term) terms.add(term);
    });
    return Array.from(terms);
  }, [submissions]);

  // Filter states - using filter chips like HomePage
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  // Status filters
  const [completedFilter, setCompletedFilter] = useState(false);
  const [pendingFilter, setPendingFilter] = useState(false);
  const [requiredFilter, setRequiredFilter] = useState(false);
  const [optionalFilter, setOptionalFilter] = useState(false);
  const [overdueFilter, setOverdueFilter] = useState(false);
  // Additional status filters
  const [requiresSubmissionFilter, setRequiresSubmissionFilter] = useState(false);
  // Toggle filters
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [retakableFilter, setRetakableFilter] = useState(false);
  const [gradedFilter, setGradedFilter] = useState('all');
  // Performance filters
  const [filterViewMode, setFilterViewMode] = useState(() => {
    try {
      return localStorage.getItem('filterViewMode') || 'full';
    } catch {
      return 'full';
    }
  });

  // Get primary color from CSS variable
  const getPrimaryColor = () => {
    if (typeof window === 'undefined') return '#800020';
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue('--color-primary').trim() || '#800020';
  };

  const primaryColor = getPrimaryColor();

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [programsRes, subjectsRes, classesRes, activitiesRes, usersRes, categoriesRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getActivities(),
        getUsers(),
        getCategories()
      ]);

      let programsData = programsRes.success ? (programsRes.data || []) : [];
      let subjectsData = subjectsRes.success ? (subjectsRes.data || []) : [];
      let classesData = classesRes.success ? (classesRes.data || []) : [];
      let activitiesData = activitiesRes.success ? (activitiesRes.data || []) : [];
      let usersData = usersRes.success ? (usersRes.data || []) : [];

      // Filter activities by mode
      activitiesData = activitiesData.filter(a => a.type === mode);

      // Filter for instructors
      if (isInstructor && !isAdmin && !isSuperAdmin) {
        classesData = classesData.filter(c =>
          c.instructorId === user.uid ||
          c.ownerEmail === user.email ||
          c.instructor === user.email
        );

        const accessibleSubjectIds = new Set(classesData.map(c => c.subjectId).filter(Boolean));
        subjectsData = subjectsData.filter(s => accessibleSubjectIds.has(s.docId || s.id));

        const accessibleProgramIds = new Set(subjectsData.map(s => s.programId).filter(Boolean));
        programsData = programsData.filter(p => accessibleProgramIds.has(p.docId || p.id));

        const accessibleClassIds = new Set(classesData.map(c => c.id || c.docId));
        activitiesData = activitiesData.filter(a =>
          !a.classId || accessibleClassIds.has(a.classId)
        );
      }

      setPrograms(programsData);
      setSubjects(subjectsData);
      setClasses(classesData);
      setActivities(activitiesData);
      setStudents(usersData.filter(u => u.role === 'student'));
      setCategories(categoriesRes.success ? (categoriesRes.data || []) : []);

      // Set role-specific data
      if (user?.role === 'student') {
        // Get student's enrolled classes
        const studentEnrollments = usersData.find(u => u.uid === user.uid);
        setEnrolledClasses(studentEnrollments?.enrolledClasses || []);
        setInstructorClasses([]);
        setInstructorStudents([]);
      } else if (isInstructor && !isSuperAdmin) {
        // Get instructor's classes and students
        const instructorClassIds = classesData.map(c => c.id || c.docId);
        setInstructorClasses(instructorClassIds);
        
        // Get students in instructor's classes
        const instructorStudentIds = usersData
          .filter(u => u.role === 'student')
          .filter(student => 
            student.enrolledClasses?.some(classId => instructorClassIds.includes(classId))
          )
          .map(s => s.uid);
        setInstructorStudents(instructorStudentIds);
        setEnrolledClasses([]);
      } else {
        // Admin, Super Admin, HR see all
        setEnrolledClasses([]);
        setInstructorClasses([]);
        setInstructorStudents([]);
      }

      // Load submissions
      let submissionsData = [];
      if (mode === 'quiz') {
        const submissionsResult = await getQuizSubmissions();
        submissionsData = submissionsResult.success ? submissionsResult.data : [];
      } else {
        const submissionsResult = await getSubmissions();
        submissionsData = submissionsResult.success ? submissionsResult.data : [];
        // Filter by activity type
        submissionsData = submissionsData.filter(s => {
          const activity = activitiesData.find(a => (a.id || a.docId) === s.activityId);
          return activity && activity.type === mode;
        });
      }

      // Enrich submissions with related data
      const enrichedSubmissions = submissionsData.map(sub => {
        const activity = activitiesData.find(a => (a.id || a.docId) === sub.activityId);
        const student = usersData.find(u => (u.id || u.docId || u.uid) === sub.userId);
        const classData = classesData.find(c => (c.id || c.docId) === (sub.classId || activity?.classId));
        const subject = subjectsData.find(s => (s.id || s.docId) === classData?.subjectId);
        const program = programsData.find(p => (p.id || p.docId) === subject?.programId);

        return {
          ...sub,
          id: sub.docId || sub.id,
          activityTitle: activity ? (lang === 'ar' ? (activity.title_ar || activity.title_en) : (activity.title_en || activity.title_ar)) : 'N/A',
          activityType: activity?.type || mode,
          difficulty: activity?.difficulty || activity?.level || 'beginner',
          studentName: student?.displayName || student?.email || 'N/A',
          studentEmail: student?.email || null,
          className: classData ? (classData.name || classData.code) : 'N/A',
          subjectName: subject ? (lang === 'ar' ? (subject.name_ar || subject.name_en) : (subject.name_en || subject.name_ar)) : 'N/A',
          programName: program ? (lang === 'ar' ? (program.name_ar || program.name_en) : (program.name_en || program.name_ar)) : 'N/A',
          classId: sub.classId || activity?.classId,
          subjectId: classData?.subjectId,
          programId: subject?.programId,
          activity: activity
        };
      });

      setSubmissions(enrichedSubmissions);
    } catch (error) {
      logger.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, mode, isAdmin, isInstructor, isSuperAdmin, lang]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, mode, loadData]);

  // Filter submissions or activities based on mode and user role
  const filteredSubmissions = useMemo(() => {
    // Debug logging
    console.log('ReviewResultsPage - Debug Info:', {
      mode,
      activityType,
      category,
      totalSubmissions: submissions?.length,
      submissions: submissions?.slice(0, 3), // Show first 3 submissions
      userRole: user?.role,
      isAdmin,
      isSuperAdmin,
      isInstructor,
      filters: {
        selectedProgram,
        selectedSubject,
        selectedClass,
        selectedStudent,
        selectedYear,
        selectedTerm,
        difficultyFilter,
        completedFilter,
        pendingFilter,
        requiredFilter,
        optionalFilter,
        overdueFilter,
        requiresSubmissionFilter,
        bookmarkFilter,
        featuredFilter,
        retakableFilter,
        gradedFilter
      }
    });

    // For activities mode, return activities instead of submissions
    if (mode === MODE_TYPES.ACTIVITIES) {
      let filtered = [...activities];

      // Role-based filtering for activities
      if (user?.role === 'student') {
        // Students see only activities assigned to their enrolled classes
        filtered = filtered.filter(a => 
          !a.classId || enrolledClasses.includes(a.classId)
        );
      } else if (isInstructor && !isSuperAdmin) {
        // Instructors see only activities from their classes
        filtered = filtered.filter(a => 
          !a.classId || instructorClasses.includes(a.classId)
        );
      }
      // Admin, Super Admin, HR see all activities

      // Filter by activity type
      if (activityType !== 'all') {
        filtered = filtered.filter(a => a.type === activityType);
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(a => {
          const title = lang === 'ar' ? (a.title_ar || a.title_en || a.title || '') : (a.title_en || a.title_ar || a.title || '');
          return title.toLowerCase().includes(q);
        });
      }

      // Category filter
      if (category !== '') {
        filtered = filtered.filter(a => (a.course || 'general') === category);
      }

      return filtered;
    }

    // For other modes, filter submissions with role-based access
    let filtered = [...submissions];

    // Role-based filtering for submissions
    if (user?.role === 'student') {
      // Students see only their own submissions
      filtered = filtered.filter(sub => sub.studentId === user.uid);
    } else if (isInstructor && !isSuperAdmin) {
      // Instructors see submissions from their students/classes
      filtered = filtered.filter(sub => 
        instructorClasses.includes(sub.classId) || 
        instructorStudents.includes(sub.studentId)
      );
    }
    // Admin, Super Admin, HR see all submissions

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(sub =>
        sub.activityTitle.toLowerCase().includes(q) ||
        sub.studentName.toLowerCase().includes(q) ||
        sub.studentEmail?.toLowerCase().includes(q) ||
        sub.programName.toLowerCase().includes(q) ||
        sub.subjectName.toLowerCase().includes(q) ||
        sub.className.toLowerCase().includes(q)
      );
    }

    // Program filter
    if (selectedProgram !== 'all') {
      filtered = filtered.filter(sub => sub.programId === selectedProgram);
    }

    // Subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(sub => sub.subjectId === selectedSubject);
    }

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(sub => sub.classId === selectedClass);
    }

    // Student filter
    if (selectedStudent !== 'all') {
      filtered = filtered.filter(sub => sub.userId === selectedStudent);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(sub => sub.difficulty === difficultyFilter);
    }

    // Sort by submission date (newest first)
    filtered.sort((a, b) => {
      const aTime = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
      const bTime = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
      return bTime - aTime;
    });

    return filtered;
  }, [mode, activities, submissions, searchTerm, selectedProgram, selectedSubject, selectedClass, selectedStudent, difficultyFilter, activityType, category, lang, bookmarkFilter, completedFilter, enrolledClasses, featuredFilter, gradedFilter, instructorClasses, instructorStudents, isAdmin, isInstructor, isSuperAdmin, optionalFilter, overdueFilter, pendingFilter, requiredFilter, requiresSubmissionFilter, retakableFilter, selectedTerm, selectedYear, user]);

  // Calculate filter counts using the hook
  const filterCounts = useSubmissionFilterCounts(filteredSubmissions, {
    mode,
    completedFilter,
    pendingFilter,
    requiredFilter,
    optionalFilter,
    overdueFilter,
    requiresSubmissionFilter
  });

  // Calculate counts for each activity type based on role and filters
  const getActivityTypeCount = useCallback((type) => {
    if (mode === MODE_TYPES.ACTIVITIES) {
      let filtered = [...activities];

      // Apply role-based filtering
      if (user?.role === 'student') {
        filtered = filtered.filter(a => 
          !a.classId || enrolledClasses.includes(a.classId)
        );
      } else if (isInstructor && !isSuperAdmin) {
        filtered = filtered.filter(a => 
          !a.classId || instructorClasses.includes(a.classId)
        );
      }

      // Filter by activity type
      if (type !== 'all') {
        filtered = filtered.filter(a => a.type === type);
      }

      // Apply category filter
      if (category !== '') {
        filtered = filtered.filter(a => (a.course || 'general') === category);
      }

      // Apply search filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(a => {
          const title = lang === 'ar' ? (a.title_ar || a.title_en || a.title || '') : (a.title_en || a.title_ar || a.title || '');
          return title.toLowerCase().includes(q);
        });
      }

      return filtered.length;
    } else {
      // For non-activities modes, count submissions by activity type
      let filtered = [...submissions];

      // Apply role-based filtering
      if (user?.role === 'student') {
        filtered = filtered.filter(sub => sub.studentId === user.uid);
      } else if (isInstructor && !isSuperAdmin) {
        filtered = filtered.filter(sub => 
          instructorClasses.includes(sub.classId) || 
          instructorStudents.includes(sub.studentId)
        );
      }

      // Filter by activity type
      if (type !== 'all') {
        filtered = filtered.filter(sub => sub.activityType === type);
      }

      // Apply other filters
      if (selectedProgram !== 'all') {
        filtered = filtered.filter(sub => sub.programId === selectedProgram);
      }
      if (selectedSubject !== 'all') {
        filtered = filtered.filter(sub => sub.subjectId === selectedSubject);
      }
      if (selectedClass !== 'all') {
        filtered = filtered.filter(sub => sub.classId === selectedClass);
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(sub =>
          sub.activityTitle.toLowerCase().includes(q) ||
          sub.studentName.toLowerCase().includes(q)
        );
      }

      return filtered.length;
    }
  }, [mode, activities, submissions, user, enrolledClasses, instructorClasses, instructorStudents, category, searchTerm, selectedProgram, selectedSubject, selectedClass, lang, isInstructor, isSuperAdmin]);

  // Calculate counts for each category based on role and filters
  const getCategoryCount = useCallback((categoryId) => {
    if (mode !== 'activities') return 0;
    
    let filtered = [...activities];

    // Apply role-based filtering
    if (user?.role === 'student') {
      filtered = filtered.filter(a => 
        !a.classId || enrolledClasses.includes(a.classId)
      );
    } else if (isInstructor && !isSuperAdmin) {
      filtered = filtered.filter(a => 
        !a.classId || instructorClasses.includes(a.classId)
      );
    }

    // Filter by activity type
    if (activityType !== 'all') {
      filtered = filtered.filter(a => a.type === activityType);
    }

    // Filter by category
    if (categoryId !== '') {
      filtered = filtered.filter(a => (a.course || 'general') === categoryId);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(a => {
        const title = lang === 'ar' ? (a.title_ar || a.title_en || a.title || '') : (a.title_en || a.title_ar || a.title || '');
        return title.toLowerCase().includes(q);
      });
    }

    return filtered.length;
  }, [mode, activities, user, enrolledClasses, instructorClasses, activityType, searchTerm, lang, isInstructor, isSuperAdmin]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredSubmissions.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0
      };
    }

    const total = filteredSubmissions.length;
    const passed = filteredSubmissions.filter(sub => {
      const percentage = sub.maxScore > 0 ? (sub.score / sub.maxScore) * 100 : 0;
      return percentage >= 60;
    }).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed
    };
  }, [filteredSubmissions]);

  const handleViewDetails = (submission) => {
    if (mode === 'quiz') {
      navigate(`/quiz-preview/${submission.activityId}?resultId=${submission.id}`);
    } else {
      navigate(`/submission/${submission.id}`);
    }
  };

  const isMinified = filterViewMode === 'minified';

  // Auth loading check
  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading || redirectLoading) return;
    if (!isAuthenticated) return;
    if (!user) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        await Promise.all([
          loadSubmissions(),
          loadPrograms(),
          loadSubjects(),
          loadClasses(),
          loadActivities(),
          loadUsers(),
          loadCategories()
        ]);
      } catch (error) {
        console.error('Error loading review data:', error);
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, redirectLoading, isAuthenticated, user, startLoading]);

  return (
    <div className="review-results-page" data-theme={theme} style={{ padding: '0rem 0', position: 'relative' }}>
      {/* No inline loading needed - GlobalLoading handles page-level loading */}
      
      <div className="content-section" style={{ position: 'relative' }}>
        {/* Activity Type Tabs - Main navigation for ReviewResultsPage */}
        <div data-tour="activity-type-tabs" style={{ marginBottom: '0.15rem' }}>
          <Tabs
            tabs={[
              {
                value: 'all',
                label: lang === 'en' ? 'All' : 'الكل',
                icon: activityType === 'all' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor),
                badge: getActivityTypeCount('all')
              },
                {
                  value: 'quiz',
                  label: lang === 'en' ? 'Quiz' : 'اختبار',
                  icon: activityType === 'quiz' ? getIconWithColor('ui', getActivityTypeConfig('quiz', theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig('quiz', theme, lang).icon, 16, primaryColor),
                  badge: getActivityTypeCount('quiz')
                },
                {
                  value: 'homework',
                  label: lang === 'en' ? 'Homework' : 'واجب',
                  icon: activityType === 'homework' ? getIconWithColor('ui', getActivityTypeConfig('homework', theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig('homework', theme, lang).icon, 16, primaryColor),
                  badge: getActivityTypeCount('homework')
                },
                {
                  value: 'training',
                  label: lang === 'en' ? 'Training' : 'تدريب',
                  icon: activityType === 'training' ? getIconWithColor('ui', getActivityTypeConfig('training', theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig('training', theme, lang).icon, 16, primaryColor),
                  badge: getActivityTypeCount('training')
                },
                {
                  value: 'labandproject',
                  label: lang === 'en' ? 'Lab & Project' : 'معمل ومشروع',
                  icon: activityType === 'labandproject' ? getIconWithColor('ui', getActivityTypeConfig('labandproject', theme, lang).icon, 16, '#ffffff') : getIconWithColor('ui', getActivityTypeConfig('labandproject', theme, lang).icon, 16, primaryColor),
                  badge: getActivityTypeCount('labandproject')
                }
              ]}
              activeTab={activityType}
              onTabChange={setActivityType}
              variant="default"
            />
          </div>

        {/* Category Tabs - Third row (only for activities mode) */}
        {mode === MODE_TYPES.ACTIVITIES && (
          <div data-tour="category-tabs" style={{ marginBottom: '0.15rem' }}>
            <Tabs
              tabs={[
                {
                  value: '',
                  label: lang === 'en' ? 'All' : 'الكل',
                  icon: category === '' ? getIconWithColor('ui', 'globe2', 16, '#ffffff') : getIconWithColor('ui', 'globe2', 16, primaryColor),
                  badge: getCategoryCount('')
                },
                ...(categories.length ? categories.map(c => {
                  return {
                    value: c.docId || c.id,
                    label: lang === 'ar' ? (c.name_ar || c.name_en || c.docId || c.id) : (c.name_en || c.name_ar || c.docId || c.id),
                    icon: category === (c.docId || c.id) ? getIconWithColor('ui', c.icon?.toLowerCase() || 'folder', 16, '#ffffff') : getIconWithColor('ui', c.icon?.toLowerCase() || 'folder', 16, primaryColor),
                    badge: getCategoryCount(c.docId || c.id)
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
        <UnifiedFilterSection
          stats={stats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchPlaceholder={t('search') || 'Search...'}
          // Status filters
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
          // Difficulty filter
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          // Toggle filters
          bookmarkFilter={bookmarkFilter}
          setBookmarkFilter={setBookmarkFilter}
          featuredFilter={featuredFilter}
          setFeaturedFilter={setFeaturedFilter}
          retakableFilter={retakableFilter}
          setRetakableFilter={setRetakableFilter}
          gradedFilter={gradedFilter}
          setGradedFilter={setGradedFilter}
          // Hierarchy filters
          programs={programs}
          subjects={subjects}
          classes={classes}
          students={students}
          years={availableYears}
          terms={availableTerms}
          selectedProgram={selectedProgram}
          setSelectedProgram={setSelectedProgram}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedTerm={selectedTerm}
          setSelectedTerm={setSelectedTerm}
          isMinified={isMinified}
          theme={theme}
          lang={lang}
          t={t}
          primaryColor={primaryColor}
          showStatusFilters={true}
          showDifficultyFilters={true}
          showToggleFilters={true}
          showHierarchyFilters={true}
          hierarchyConfig={{
            showPrograms: true,
            showSubjects: true,
            showClasses: true,
            showStudents: true,
            showYears: true,
            showTerms: true
          }}
          toggleConfig={{
            showBookmark: true,
            showFeatured: true,
            showRetakable: true,
            showGraded: true
          }}
        />

        {/* Submissions Cards Grid */}
        {filteredSubmissions.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                color: isDark ? '#9ca3af' : '#666'
              }}>
                <h3>{t('no_results_found') || 'No results found'}</h3>
                <p>{t('try_adjusting_filters') || 'Try adjusting your filters'}</p>
              </div>
            ) : (
              filteredSubmissions.map(submission => {
                const percentage = submission.maxScore > 0 ? ((submission.score / submission.maxScore) * 100).toFixed(1) : 0;
                const scoreClass = percentage >= 90 ? 'excellent' : percentage >= 60 ? 'good' : 'failed';
                
                return (
                  <div
                    key={submission.id}
                    className="submission-card"
                    data-theme={theme}
                    onClick={() => handleViewDetails(submission)}
                  >
                    <div className="submission-card-header">
                      <div style={{ flex: 1 }}>
                        <div className="submission-card-title">{submission.activityTitle}</div>
                        <div className="submission-card-meta">
                          {getColoredIcon('ui', 'user', 12, '#6b7280', theme)}
                          <span>{submission.studentName}</span>
                        </div>
                      </div>
                      <Badge variant={scoreClass === 'excellent' ? 'success' : scoreClass === 'good' ? 'warning' : 'danger'}>
                        {percentage}%
                      </Badge>
                    </div>

                    <div className="submission-card-score">
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: scoreClass === 'excellent' ? '#16a34a' : scoreClass === 'good' ? '#f59e0b' : '#dc2626' }}>
                        {submission.score}/{submission.maxScore}
                      </div>
                      <div className={`score-badge ${scoreClass}`}>
                        {scoreClass === 'excellent' ? (t('excellent') || 'Excellent') : 
                         scoreClass === 'good' ? (t('passed') || 'Passed') : 
                         (t('failed') || 'Failed')}
                      </div>
                    </div>

                    <div className="submission-card-tags">
                      <div className="tag" style={{ borderColor: primaryColor, color: primaryColor }}>
                        {submission.programName}
                      </div>
                      <div className="tag" style={{ borderColor: '#6b7280', color: '#6b7280' }}>
                        {submission.subjectName}
                      </div>
                      <div className="tag" style={{ borderColor: '#6b7280', color: '#6b7280' }}>
                        {submission.className}
                      </div>
                    </div>

                    <div className="submission-card-footer">
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {submission.submittedAt && formatDateTime(submission.submittedAt)}
                      </div>
                      <button
                        className="view-button"
                        style={{
                          background: primaryColor,
                          color: '#fff'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(submission);
                        }}
                      >
                        {t('view_details') || 'View Details'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
      </div>
    </div>
  );
};

export default ReviewResultsPage;
