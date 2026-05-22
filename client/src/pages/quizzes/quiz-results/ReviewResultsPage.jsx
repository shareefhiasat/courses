import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { useFilterCounts } from '@hooks/useFilterCounts';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MODE_TYPES } from '@utils/sharedTypes';
import { Container, Card, CardBody, Tabs, Badge } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getAcademicTermOptions, getAcademicTermLabel } from '@constants/academicTerms';
import iconTypes from '@constants/iconTypes';
const { getThemedIcon, getColoredIcon, getIconWithColor } = iconTypes;
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getActivities } from '@services/business/activitiesService';
import { getUsers } from '@services/business/userService';
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

  // Focus on activities mode only - simplified from HomePage
  const [activityType, setActivityType] = useState(searchParams.get('activityType') || 'all');

  // Update URL when activityType changes
  const handleActivityTypeChange = useCallback((newActivityType) => {
    setActivityType(newActivityType);
    searchParams.set('activityType', newActivityType);
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Sync activityType with URL
  useEffect(() => {
    const urlActivityType = searchParams.get('activityType');
    if (urlActivityType && urlActivityType !== activityType) {
      setActivityType(urlActivityType);
    }
  }, [searchParams, activityType]);
  
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
    
    // Convert to options with localized labels
    const termValues = Array.from(terms).sort();
    return termValues.map(termValue => ({
      value: termValue,
      label: getAcademicTermLabel(termValue, lang, t)
    }));
  }, [submissions, lang, t]);

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

  // Load data - simplified for activities focus
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

      // Load submissions for review results
      const submissionsResult = await getSubmissions();
      let submissionsData = submissionsResult.success ? submissionsResult.data : [];
      
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
          activityTitle: activity ? (lang === 'ar' ? (activity.titleAr || activity.titleEn) : (activity.titleEn || activity.titleAr)) : 'N/A',
          activityType: activity?.type || 'unknown',
          difficulty: activity?.difficulty || activity?.level || 'beginner',
          studentName: student?.displayName || student?.email || 'N/A',
          studentEmail: student?.email || null,
          className: classData ? (classData.name || classData.code) : 'N/A',
          subjectName: subject ? (lang === 'ar' ? (subject.nameAr || subject.nameEn) : (subject.nameEn || subject.nameAr)) : 'N/A',
          programName: program ? (lang === 'ar' ? (program.nameAr || program.nameEn) : (program.nameEn || program.nameAr)) : 'N/A',
          classId: sub.classId || activity?.classId,
          subjectId: classData?.subjectId,
          programId: subject?.programId,
          activity: activity
        };
      });

      setSubmissions(enrichedSubmissions);
    } catch (error) {
      error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isInstructor, isSuperAdmin, lang]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, loadData]);

  // Filter submissions for review results - activity focused
  const filteredSubmissions = useMemo(() => {
    // Debug logging
    console.log('ReviewResultsPage - Debug Info:', {
      activityType,
      category,
      totalSubmissions: submissions?.length,
      submissions: submissions?.slice(0, 3), // Show first 3 submissions
      totalActivities: activities?.length,
      activities: activities?.slice(0, 3), // Show first 3 activities
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

    // If there are no submissions for the selected activity type, show activities instead
    const hasSubmissionsForActivityType = submissions.some(sub => 
      activityType === 'all' || sub.activityType === activityType
    );

    if (!hasSubmissionsForActivityType) {
      // Return activities that match the activity type (like HomePage)
      let filtered = [...activities];

      // Apply role-based filtering for activities
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

      // Apply search filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(a => {
          const title = lang === 'ar' ? (a.titleAr || a.titleEn || a.title || '') : (a.titleEn || a.titleAr || a.title || '');
          return title.toLowerCase().includes(q);
        });
      }

      // Apply other filters to activities
      if (completedFilter) {
        filtered = filtered.filter(a => {
          const aid = a.docId || a.id;
          const submission = submissions.find(s => s.activityId === aid);
          return submission && (submission.status === 'graded' || submission.status === 'completed');
        });
      }
      if (pendingFilter) {
        filtered = filtered.filter(a => {
          const aid = a.docId || a.id;
          const submission = submissions.find(s => s.activityId === aid);
          return !submission || submission.status === 'pending';
        });
      }
      if (requiredFilter) {
        filtered = filtered.filter(a => !a.optional);
      }
      if (optionalFilter) {
        filtered = filtered.filter(a => a.optional);
      }
      if (overdueFilter) {
        const now = new Date();
        filtered = filtered.filter(a => {
          if (!a.dueDate) return false;
          const dueDate = a.dueDate?.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
          const aid = a.docId || a.id;
          const submission = submissions.find(s => s.activityId === aid);
          return dueDate < now && (!submission || submission.status !== 'completed');
        });
      }
      if (requiresSubmissionFilter) {
        filtered = filtered.filter(a => a.requiresSubmission === true);
      }

      // Convert activities to submission-like objects for display
      return filtered.map(activity => ({
        id: activity.docId || activity.id,
        activityTitle: lang === 'ar' ? (activity.titleAr || activity.titleEn) : (activity.titleEn || activity.titleAr),
        activityType: activity.type,
        activity: activity,
        studentName: 'No submissions yet',
        programName: 'N/A',
        subjectName: 'N/A',
        className: 'N/A',
        score: 0,
        maxScore: 0,
        submittedAt: activity.createdAt || activity.dueDate,
        status: 'pending'
      }));
    }

    // Original submission filtering logic
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

    // Filter by activity type
    if (activityType !== 'all') {
      filtered = filtered.filter(sub => sub.activityType === activityType);
    }

    // Apply status filters based on activity properties
    if (completedFilter) {
      filtered = filtered.filter(sub => sub.activity?.optional === false && (sub.status === 'graded' || sub.status === 'completed'));
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
        const dueDate = sub.activity.dueDate?.seconds ? new Date(sub.activity.dueDate.seconds * 1000) : new Date(sub.activity.dueDate);
        return dueDate < now && sub.status !== 'completed';
      });
    }
    if (requiresSubmissionFilter) {
      filtered = filtered.filter(sub => sub.activity?.requiresSubmission === true);
    }

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

    // Toggle filters
    if (bookmarkFilter) {
      filtered = filtered.filter(sub => sub.activity?.bookmarked === true);
    }
    if (featuredFilter) {
      filtered = filtered.filter(sub => sub.activity?.featured === true);
    }
    if (retakableFilter) {
      filtered = filtered.filter(sub => sub.activity?.allowRetake === true || sub.activity?.settings?.allowRetake === true);
    }
    if (gradedFilter !== 'all') {
      if (gradedFilter === 'graded') {
        filtered = filtered.filter(sub => sub.status === 'graded');
      } else if (gradedFilter === 'not_graded') {
        filtered = filtered.filter(sub => sub.status !== 'graded');
      }
    }

    // Sort by submission date (newest first)
    filtered.sort((a, b) => {
      const aTime = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
      const bTime = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
      return bTime - aTime;
    });

    return filtered;
  }, [submissions, activities, searchTerm, selectedProgram, selectedSubject, selectedClass, selectedStudent, difficultyFilter, activityType, category, lang, bookmarkFilter, completedFilter, enrolledClasses, featuredFilter, gradedFilter, instructorClasses, instructorStudents, isAdmin, isInstructor, isSuperAdmin, optionalFilter, overdueFilter, pendingFilter, requiredFilter, requiresSubmissionFilter, retakableFilter, selectedTerm, selectedYear, user]);

  // Calculate filter counts using the same hook as HomePage
  const filterCounts = useFilterCounts(activities, {
    mode: 'activities',
    submissions: submissions.reduce((acc, sub) => {
      acc[sub.activityId] = sub;
      return acc;
    }, {}),
    activityType: activityType
  });

  // Calculate counts for each activity type based on role and filters
  const getActivityTypeCount = useCallback((type) => {
    // Count activities by type (like HomePage)
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
        const title = lang === 'ar' ? (a.titleAr || a.titleEn || a.title || '') : (a.titleEn || a.titleAr || a.title || '');
        return title.toLowerCase().includes(q);
      });
    }

    return filtered.length;
  }, [activities, user, enrolledClasses, instructorClasses, category, searchTerm, lang, isInstructor, isSuperAdmin]);

  // Calculate statistics - include all filter counts like HomePage
  const stats = useMemo(() => {
    return {
      // Map filterCounts to StatsBar expected format
      completed: filterCounts.completedCount,
      pending: filterCounts.pendingCount,
      required: filterCounts.requiredCount,
      optional: filterCounts.optionalCount,
      overdue: filterCounts.overdueCount,
      requiresSubmission: filterCounts.requiresSubmissionCount,
      bookmark: filterCounts.bookmark,
      featured: filterCounts.featured,
      retakable: filterCounts.retakable,
      // Keep existing stats
      total: filteredSubmissions.length,
      passed: filteredSubmissions.filter(sub => {
        const percentage = sub.maxScore > 0 ? (sub.score / sub.maxScore) * 100 : 0;
        return percentage >= 60;
      }).length,
      failed: filteredSubmissions.filter(sub => {
        const percentage = sub.maxScore > 0 ? (sub.score / sub.maxScore) * 100 : 0;
        return percentage < 60;
      }).length
    };
  }, [filteredSubmissions, filterCounts]);

  const handleViewDetails = (submission) => {
    // Route based on activity type
    const type = submission.activityType || submission.activity?.type;
    
    if (type === 'quiz') {
      navigate(`/quiz-preview/${submission.activityId}?resultId=${submission.id}`);
    } else if (type === 'training') {
      navigate(`/training-preview/${submission.activityId}?resultId=${submission.id}`);
    } else if (type === 'labandproject' || type === 'lab_work') {
      navigate(`/lab-preview/${submission.activityId}?resultId=${submission.id}`);
    } else {
      // Default to submission view for homework and other types
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

    const loadData2 = async () => {
      try {
        await loadData();
      } catch (error) {
        error('Error loading review data:', error);
      } finally {
        safeStop();
      }
    };

    loadData2();

    return () => {
      safeStop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, redirectLoading, isAuthenticated, user, startLoading]);

  return (
    <div className="review-results-page" data-theme={theme} style={{ padding: '0rem 0', position: 'relative' }}>
      {/* No inline loading needed - GlobalLoading handles page-level loading */}
      
      <div className="content-section" style={{ position: 'relative' }}>
        {/* Activity Type Tabs - Main navigation like HomePage */}
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
                icon: activityType === 'quiz' ? getIconWithColor('ui', 'list_checks', 16, '#ffffff') : getIconWithColor('ui', 'list_checks', 16, primaryColor),
                badge: getActivityTypeCount('quiz')
              },
              {
                value: 'homework',
                label: lang === 'en' ? 'Homework' : 'واجب',
                icon: activityType === 'homework' ? getIconWithColor('activity_type', getActivityTypeConfig('homework').icon, 16, '#ffffff') : getIconWithColor('activity_type', getActivityTypeConfig('homework').icon, 16, primaryColor),
                badge: getActivityTypeCount('homework')
              },
              {
                value: 'training',
                label: lang === 'en' ? 'Training' : 'تدريب',
                icon: activityType === 'training' ? getIconWithColor('activity_type', getActivityTypeConfig('training').icon, 16, '#ffffff') : getIconWithColor('activity_type', getActivityTypeConfig('training').icon, 16, primaryColor),
                badge: getActivityTypeCount('training')
              },
              {
                value: 'lab_work',
                label: lang === 'en' ? 'Lab & Project' : 'معمل ومشروع',
                icon: activityType === 'lab_work' ? getIconWithColor('activity_type', getActivityTypeConfig('lab_work').icon, 16, '#ffffff') : getIconWithColor('activity_type', getActivityTypeConfig('lab_work').icon, 16, primaryColor),
                badge: getActivityTypeCount('lab_work')
              }
            ]}
            activeTab={activityType}
            onTabChange={handleActivityTypeChange}
            variant="default"
          />
        </div>

        {/* Unified Filters Section */}
        <UnifiedFilterSection
          stats={stats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchPlaceholder={t('search') || 'Search...'}
          filterCounts={filterCounts}
          // Status filters
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
        <div className="cards-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '1.5rem', 
          marginTop: '2rem' 
        }}>
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
              const isActivityWithoutSubmission = submission.studentName === 'No submissions yet';
              const percentage = !isActivityWithoutSubmission && submission.maxScore > 0 ? ((submission.score / submission.maxScore) * 100).toFixed(1) : 0;
              const scoreClass = !isActivityWithoutSubmission ? (percentage >= 90 ? 'excellent' : percentage >= 60 ? 'good' : 'failed') : 'pending';
              
              return (
                <div
                  key={submission.id}
                  className="submission-card"
                  data-theme={theme}
                  onClick={() => !isActivityWithoutSubmission && handleViewDetails(submission)}
                  style={{ cursor: isActivityWithoutSubmission ? 'default' : 'pointer' }}
                >
                  <div className="submission-card-header">
                    <div style={{ flex: 1 }}>
                      <div className="submission-card-title">{submission.activityTitle}</div>
                      <div className="submission-card-meta">
                        {getColoredIcon('ui', 'user', 12, '#6b7280', theme)}
                        <span>{submission.studentName}</span>
                      </div>
                    </div>
                    {!isActivityWithoutSubmission && (
                      <Badge variant={scoreClass === 'excellent' ? 'success' : scoreClass === 'good' ? 'warning' : 'danger'}>
                        {percentage}%
                      </Badge>
                    )}
                    {isActivityWithoutSubmission && (
                      <Badge variant="secondary">
                        {t('no_submissions') || 'No Submissions'}
                      </Badge>
                    )}
                  </div>

                  {!isActivityWithoutSubmission && (
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
                )}

                {isActivityWithoutSubmission && (
                  <div className="submission-card-score" style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280' }}>
                      {t('activity_pending') || 'Activity Pending'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {submission.activityType && (
                        <span style={{ 
                          textTransform: 'capitalize', 
                          background: '#f3f4f6', 
                          padding: '2px 8px', 
                          borderRadius: '12px',
                          fontSize: '0.75rem'
                        }}>
                          {submission.activityType}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                  <div className="submission-card-tags">
                    {!isActivityWithoutSubmission && (
                      <>
                        <div className="tag" style={{ borderColor: primaryColor, color: primaryColor }}>
                          {submission.programName}
                        </div>
                        <div className="tag" style={{ borderColor: '#6b7280', color: '#6b7280' }}>
                          {submission.subjectName}
                        </div>
                        <div className="tag" style={{ borderColor: '#6b7280', color: '#6b7280' }}>
                          {submission.className}
                        </div>
                      </>
                    )}
                    {isActivityWithoutSubmission && submission.activity && (
                      <>
                        {submission.activity.difficulty && (
                          <div className="tag" style={{ borderColor: '#6b7280', color: '#6b7280' }}>
                            {submission.activity.difficulty}
                          </div>
                        )}
                        {!submission.activity.optional && (
                          <div className="tag" style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                            {t('required') || 'Required'}
                          </div>
                        )}
                        {submission.activity.optional && (
                          <div className="tag" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
                            {t('optional') || 'Optional'}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="submission-card-footer">
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {submission.submittedAt && formatDateTime(submission.submittedAt)}
                    </div>
                    {!isActivityWithoutSubmission && (
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
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewResultsPage;
