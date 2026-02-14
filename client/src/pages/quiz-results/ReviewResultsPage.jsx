import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, CardBody, Button, Select, Loading, Badge, useToast, AdvancedDataGrid, CollapsibleDashboardSection, Tabs } from '@ui';
import { InfoTooltip } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getActivities } from '@services/business/activityService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getUsers } from '@services/business/userService';
import { getQuizSubmissions } from '@services/business/quizSubmissionsService';
import { getSubmissions } from '@services/business/submissionsService';
import { getCardConfig, getShapeRadius } from '@utils/cardColors';
import styles from './QuizResultsPage.module.css';

const ReviewResultsPage = () => {
  const { user, isAdmin, isInstructor, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  // Get mode from URL params (quiz, homework, training) or default to quiz
  const mode = searchParams.get('mode') || 'quiz';

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [activities, setActivities] = useState([]);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  // Filters
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [filterRetake, setFilterRetake] = useState('all'); // all, yes, no
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterHasImage, setFilterHasImage] = useState('all'); // all, yes, no
  const [filterIsOptional, setFilterIsOptional] = useState('all'); // all, yes, no
  const [filterIsFeatured, setFilterIsFeatured] = useState('all'); // all, yes, no
  const [filterRequiresSubmission, setFilterRequiresSubmission] = useState('all'); // all, yes, no
  const [searchActivityId, setSearchActivityId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load programs, subjects, classes with permission filtering
      const [programsRes, subjectsRes, classesRes, activitiesRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getActivities()
      ]);

      let programsData = programsRes.success ? (programsRes.data || []) : [];
      let subjectsData = subjectsRes.success ? (subjectsRes.data || []) : [];
      let classesData = classesRes.success ? (classesRes.data || []) : [];
      let activitiesData = activitiesRes.success ? (activitiesRes.data || []) : [];

      // Filter activities by mode (quiz, homework, training, labandproject)
      activitiesData = activitiesData.filter(a => a.type === mode);

      // Filter for instructors: only show classes they have access to
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

        // Filter activities by accessible classes
        const accessibleClassIds = new Set(classesData.map(c => c.id || c.docId));
        activitiesData = activitiesData.filter(a =>
          !a.classId || accessibleClassIds.has(a.classId)
        );
      }

      setPrograms(programsData);
      setSubjects(subjectsData);
      setClasses(classesData);
      setActivities(activitiesData);

      // Load students - filter by accessible classes for instructors
      if (isInstructor && !isAdmin && !isSuperAdmin) {
        const accessibleClassIds = classesData.map(c => c.id || c.docId);
        const enrollmentsResult = await getEnrollments();
        const enrollmentsData = enrollmentsResult.success ? enrollmentsResult.data : [];
        const filteredEnrollments = enrollmentsData.filter(e => 
          accessibleClassIds.slice(0, 10).includes(e.classId)
        );
        const studentIds = new Set(filteredEnrollments.map(e => e.userId).filter(Boolean));
        const studentsData = await Promise.all(
          Array.from(studentIds).slice(0, 50).map(async (studentId) => {
            try {
              const usersResult = await getUsers();
              if (usersResult.success) {
                return usersResult.data.find(u => (u.docId || u.id) === studentId);
              }
            } catch (err) {
              logger.warn('Failed to load student:', studentId, err);
            }
            return null;
          })
        );
        setStudents(studentsData.filter(Boolean));
      } else {
        const usersResult = await getUsers();
        const studentsData = usersResult.success ? usersResult.data.filter(user => user.role === 'student') : [];
        setStudents(studentsData);
      }
    } catch (error) {
      logger.error('Failed to load data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user, mode, isAdmin, isInstructor, isSuperAdmin, toast]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, mode, loadData]);

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      // Load submissions based on mode
      let filters = {};
      if (selectedActivity !== 'all') {
        filters.activityId = selectedActivity;
      }

      let resultsData;
      if (mode === 'quiz') {
        const submissionsResult = await getQuizSubmissions(filters);
        resultsData = submissionsResult.success ? submissionsResult.data : [];
      } else {
        // For homework, training, and labandproject, use general submissions
        const submissionsResult = await getSubmissions(filters);
        resultsData = submissionsResult.success ? submissionsResult.data : [];
      }

      let results = resultsData.map(submission => {
        const data = submission;
        return {
          id: data.docId || data.id,
          docId: data.docId || data.id,
          ...data,
          activityId: data.activityId || data.quizId || null,
          userId: data.userId || null,
          score: data.score || 0,
          maxScore: data.maxScore || 100,
          submittedAt: data.submittedAt || null
        };
      });

      // Filter by activity type if needed
      if (mode !== 'quiz') {
        resultsData = resultsData.filter(r => {
          const activity = activities.find(a => (a.id || a.docId) === r.activityId);
          return activity && activity.type === mode;
        });
      }

      // Sort manually if orderBy failed
      if (resultsData.length > 0 && resultsData[0].submittedAt) {
        resultsData.sort((a, b) => {
          const aTime = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
          const bTime = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
          return bTime - aTime;
        });
      }

      // Enrich with activity, student, class, subject, program info
      const enriched = await Promise.all(resultsData.map(async (result) => {
        const enrichedResult = {
          ...result,
          id: result.id || result.docId,
          docId: result.docId || result.id,
          activityTitle: 'N/A',
          activityType: mode,
          studentName: 'N/A',
          studentEmail: null,
          className: 'N/A',
          subjectName: 'N/A',
          programName: 'N/A',
          classSubjectId: null,
          subjectProgramId: null,
          activityClassId: null,
          activityData: null
        };

        try {
          // Get activity info
          let activityData = null;
          if (result.activityId) {
            try {
              const activityDoc = await getDoc(doc(db, 'activities', result.activityId));
              if (activityDoc.exists()) {
                activityData = activityDoc.data();
                enrichedResult.activityTitle = activityData.title_en || activityData.title_ar || activityData.title || 'Unknown Activity';
                enrichedResult.activityClassId = activityData.classId;
                enrichedResult.activityData = activityData;
              }
            } catch (err) {
              logger.warn('Failed to load activity:', result.activityId, err);
            }
          }

          // Get student info
          if (result.userId) {
            try {
              const studentDoc = await getDoc(doc(db, 'users', result.userId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                enrichedResult.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedResult.studentEmail = studentData.email;
              }
            } catch (err) {
              logger.warn('Failed to load student:', result.userId, err);
            }
          }

          // Get class info
          let classId = result.classId || enrichedResult.activityClassId;
          if (classId) {
            try {
              const classDoc = await getDoc(doc(db, 'classes', classId));
              if (classDoc.exists()) {
                const classData = classDoc.data();
                enrichedResult.className = classData.name || classData.code || 'N/A';
                enrichedResult.classSubjectId = classData.subjectId;
              }
            } catch (err) {
              logger.warn('Failed to load class:', classId, err);
            }
          }

          // Get subject info
          if (enrichedResult.classSubjectId) {
            try {
              const subjectDoc = await getDoc(doc(db, 'subjects', enrichedResult.classSubjectId));
              if (subjectDoc.exists()) {
                const subjectData = subjectDoc.data();
                enrichedResult.subjectName = subjectData.name_en || subjectData.name_ar || subjectData.code || 'N/A';
                enrichedResult.subjectProgramId = subjectData.programId;
              }
            } catch (err) {
              logger.warn('Failed to load subject:', enrichedResult.classSubjectId, err);
            }
          }

          // Get program info
          if (enrichedResult.subjectProgramId) {
            try {
              const programDoc = await getDoc(doc(db, 'programs', enrichedResult.subjectProgramId));
              if (programDoc.exists()) {
                const programData = programDoc.data();
                enrichedResult.programName = programData.name_en || programData.name_ar || programData.code || 'N/A';
              }
            } catch (err) {
              logger.warn('Failed to load program:', enrichedResult.subjectProgramId, err);
            }
          }
        } catch (err) {
          logger.warn('Failed to enrich result:', err);
        }
        return enrichedResult;
      }));

      // Apply filters
      let filtered = enriched;

      if (selectedProgram !== 'all') {
        filtered = filtered.filter(r => r.subjectProgramId === selectedProgram);
      }

      if (selectedSubject !== 'all') {
        filtered = filtered.filter(r => r.classSubjectId === selectedSubject);
      }

      if (selectedClass !== 'all') {
        filtered = filtered.filter(r => (r.classId || r.activityClassId) === selectedClass);
      }

      if (selectedStudent !== 'all') {
        filtered = filtered.filter(r => r.userId === selectedStudent);
      }

      // Additional activity filters
      if (filterRetake !== 'all') {
        filtered = filtered.filter(r => {
          const activity = r.activityData;
          if (!activity) return false;
          const allowRetake = activity.allowRetake || activity.settings?.allowRetake || false;
          return filterRetake === 'yes' ? allowRetake : !allowRetake;
        });
      }

      if (filterDifficulty !== 'all') {
        filtered = filtered.filter(r => {
          const activity = r.activityData;
          return activity && activity.difficulty === filterDifficulty;
        });
      }

      if (filterHasImage !== 'all') {
        filtered = filtered.filter(r => {
          const activity = r.activityData;
          const hasImage = !!(activity && (activity.image || activity.imageUrl));
          return filterHasImage === 'yes' ? hasImage : !hasImage;
        });
      }

      if (filterIsOptional !== 'all') {
        filtered = filtered.filter(r => {
          const activity = r.activityData;
          const isOptional = activity && activity.optional === true;
          return filterIsOptional === 'yes' ? isOptional : !isOptional;
        });
      }

      if (filterIsFeatured !== 'all') {
        filtered = filtered.filter(r => {
          const activity = r.activityData;
          const isFeatured = activity && activity.featured === true;
          return filterIsFeatured === 'yes' ? isFeatured : !isFeatured;
        });
      }

      if (filterRequiresSubmission !== 'all') {
        filtered = filtered.filter(r => {
          const activity = r.activityData;
          const requiresSubmission = activity && activity.requiresSubmission === true;
          return filterRequiresSubmission === 'yes' ? requiresSubmission : !requiresSubmission;
        });
      }

      if (searchActivityId) {
        filtered = filtered.filter(r =>
          (r.activityId && r.activityId.toLowerCase().includes(searchActivityId.toLowerCase())) ||
          (r.activityData && r.activityData.id && r.activityData.id.toLowerCase().includes(searchActivityId.toLowerCase()))
        );
      }

      // For instructors: additional filtering by accessible classes
      if (isInstructor && !isAdmin && !isSuperAdmin) {
        const accessibleClassIds = new Set(classes.map(c => c.id || c.docId));
        filtered = filtered.filter(r => {
          const classId = r.classId || r.activityClassId;
          return !classId || accessibleClassIds.has(classId);
        });
      }

      setResults(filtered);
    } catch (error) {
      logger.error('Failed to load results:', error);
      toast?.error?.('Failed to load results: ' + error.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedActivity, selectedProgram, selectedSubject, selectedClass, selectedStudent, filterRetake, filterDifficulty, filterHasImage, filterIsOptional, filterIsFeatured, filterRequiresSubmission, searchActivityId, mode, activities, classes, subjects, programs, students, toast]);

  useEffect(() => {
    if (user && programs.length > 0) {
      loadResults();
    }
  }, [selectedActivity, selectedProgram, selectedSubject, selectedClass, selectedStudent, mode, user, programs.length, loadResults]);

  // Filter activities based on selections
  const filteredActivities = useMemo(() => {
    let result = activities;

    if (selectedProgram !== 'all') {
      result = result.filter(a => {
        if (!a.classId) return false;
        const classData = classes.find(c => (c.id || c.docId) === a.classId);
        if (!classData || !classData.subjectId) return false;
        const subject = subjects.find(s => (s.docId || s.id) === classData.subjectId);
        return subject?.programId === selectedProgram;
      });
    }

    if (selectedSubject !== 'all') {
      result = result.filter(a => {
        if (!a.classId) return false;
        const classData = classes.find(c => (c.id || c.docId) === a.classId);
        return classData?.subjectId === selectedSubject;
      });
    }

    if (selectedClass !== 'all') {
      result = result.filter(a => a.classId === selectedClass);
    }

    return result;
  }, [activities, classes, subjects, selectedProgram, selectedSubject, selectedClass]);

  const columns = [
    {
      field: 'studentName',
      headerName: 'Student',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const studentName = row.studentName;
        if (studentName && studentName !== 'N/A') {
          return studentName;
        }
        if (row.studentEmail) {
          return row.studentEmail;
        }
        return 'N/A';
      }
    },
    {
      field: 'activityTitle',
      headerName: 'Activity',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => {
        const row = params?.row || {};
        const activityTitle = row.activityTitle;
        if (activityTitle && activityTitle !== 'N/A') {
          return activityTitle;
        }
        return 'N/A';
      }
    },
    {
      field: 'activityId',
      headerName: 'Activity ID',
      width: 150,
      valueGetter: (params) => params?.row?.activityId || 'N/A'
    },
    {
      field: 'programName',
      headerName: 'Program',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const programName = row.programName;
        if (programName && programName !== 'N/A') {
          return programName;
        }
        return 'N/A';
      }
    },
    {
      field: 'subjectName',
      headerName: 'Subject',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const subjectName = row.subjectName;
        if (subjectName && subjectName !== 'N/A') {
          return subjectName;
        }
        return 'N/A';
      }
    },
    {
      field: 'className',
      headerName: 'Class',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const className = row.className;
        if (className && className !== 'N/A') {
          return className;
        }
        return 'N/A';
      }
    },
    {
      field: 'score',
      headerName: 'Score',
      width: 140,
      renderCell: (params) => {
        const score = params.value || 0;
        const maxScore = params.row.maxScore || 100;
        const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>{score}/{maxScore}</span>
            <Badge variant={percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'danger'}>
              {percentage}%
            </Badge>
          </div>
        );
      }
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted',
      width: 180,
      valueGetter: (params) => {
        const date = params.row.submittedAt?.toDate ? params.row.submittedAt.toDate() : new Date(params.row.submittedAt || 0);
        return date.toLocaleString('en-GB');
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (mode === 'quiz') {
              navigate(`/quiz-preview/${params.row.activityId}?resultId=${params.row.id}`);
            } else {
              // For homework/training, navigate to submission details
              navigate(`/submission/${params.row.id}`);
            }
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    if (results.length === 0) {
      return {
        total: 0,
        average: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        excellent: 0,
        good: 0,
        needsImprovement: 0,
        uniqueStudents: 0,
        uniqueActivities: 0
      };
    }

    const total = results.length;
    const totalScore = results.reduce((sum, r) => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      return sum + (maxScore > 0 ? (score / maxScore) * 100 : 0);
    }, 0);
    const average = total > 0 ? Number((totalScore / total).toFixed(1)) : 0;

    const passed = results.filter(r => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return percentage >= 60;
    }).length;

    const failed = total - passed;
    const passRate = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0;

    const excellent = results.filter(r => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return percentage >= 90;
    }).length;

    const good = results.filter(r => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return percentage >= 70 && percentage < 90;
    }).length;

    const needsImprovement = results.filter(r => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return percentage < 60;
    }).length;

    const uniqueActivities = new Set(results.map(r => r.activityId).filter(Boolean)).size;
    const uniqueStudents = new Set(results.map(r => r.userId).filter(Boolean)).size;

    return {
      total,
      average,
      passed,
      failed,
      passRate,
      excellent,
      good,
      needsImprovement,
      uniqueActivities,
      uniqueStudents
    };
  }, [results]);

  if (loading && results.length === 0) {
    return (
      <Loading
        variant="overlay"
        fullscreen
        message="Loading results..."
        fancyVariant="dots"
      />
    );
  }

  const modeLabels = {
    quiz: 'Quiz',
    homework: 'Homework',
    training: 'Training',
    labandproject: 'Lab & Project'
  };

  return (
    <Container>
      <div style={{ marginBottom: '1rem' }}>
        {/* Mode Selector - Using Tabs component */}
        <div data-tour="mode-switcher" style={{ marginBottom: '1.5rem' }}>
          <Tabs
            tabs={[
              {
                value: 'quiz',
                label: 'Quiz',
                icon: getThemedIcon('ui', 'file_text', 16, theme)
              },
              {
                value: 'homework',
                label: 'Homework',
                icon: getThemedIcon('ui', 'book_open', 16, theme)
              },
              {
                value: 'training',
                label: 'Training',
                icon: getThemedIcon('ui', 'zap', 16, theme)
              },
              {
                value: 'labandproject',
                label: 'Lab & Project',
                icon: getThemedIcon('ui', 'wrench', 16, theme)
              }
            ]}
            activeTab={mode}
            onTabChange={(tab) => navigate(`/review-results?mode=${tab}`)}
          />
        </div>

        {/* Filters - Collapsible */}
        <CollapsibleDashboardSection
          sectionId="review-filters"
          title="Filters"
          icon={getThemedIcon('ui', 'filter', 20, theme)}
          color="#6366f1"
          defaultMode="full"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <Select
                searchable
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedSubject('all');
                  setSelectedClass('all');
                }}
                options={[
                  { value: 'all', label: 'All Programs', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId
                  }))
                ]}
                placeholder="Select Program (All Programs)"
                fullWidth
              />
              <Select
                searchable
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedClass('all');
                }}
                options={[
                  { value: 'all', label: 'All Subjects', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  ...subjects
                    .filter(s => selectedProgram === 'all' || s.programId === selectedProgram)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim()
                    }))
                ]}
                placeholder="Select Subject (All Subjects)"
                fullWidth
              />
              <Select
                searchable
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={[
                  { value: 'all', label: 'All Classes', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  ...classes
                    .filter(c => {
                      if (selectedProgram !== 'all') {
                        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                        return subject?.programId === selectedProgram;
                      }
                      if (selectedSubject !== 'all') {
                        return c.subjectId === selectedSubject;
                      }
                      return true;
                    })
                    .map(c => ({
                      value: c.id || c.docId,
                      label: `${c.name || c.code || c.id}${c.term ? ` (${c.term})` : ''}`
                    }))
                ]}
                placeholder="Select Class (All Classes)"
                fullWidth
              />
              <Select
                searchable
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                options={[
                  { value: 'all', label: `All ${modeLabels[mode]}s`, icon: getThemedIcon('ui', 'filter', 14, theme) },
                  ...filteredActivities.map(a => ({
                    value: a.id || a.docId,
                    label: a.title_en || a.title_ar || a.title || a.id
                  }))
                ]}
                placeholder={`Select ${modeLabels[mode]} (All ${modeLabels[mode]}s)`}
                fullWidth
              />
              <Select
                searchable
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                options={[
                  { value: 'all', label: 'All Students', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  ...students.map(s => ({
                    value: s.id || s.docId,
                    label: `${s.displayName || s.email}${s.email ? ` (${s.email})` : ''}`
                  }))
                ]}
                placeholder="Select Student (All Students)"
                fullWidth
              />
              <Select
                value={filterRetake}
                onChange={(e) => setFilterRetake(e.target.value)}
                options={[
                  { value: 'all', label: 'All Retake Settings', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  { value: 'yes', label: 'Retake Allowed' },
                  { value: 'no', label: 'No Retake' }
                ]}
                placeholder="Retake Setting (All)"
                fullWidth
              />
              <Select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                options={[
                  { value: 'all', label: 'All Difficulties', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                placeholder="Difficulty Level (All)"
                fullWidth
              />
              <Select
                value={filterHasImage}
                onChange={(e) => setFilterHasImage(e.target.value)}
                options={[
                  { value: 'all', label: 'All Image Settings', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  { value: 'yes', label: 'Has Image' },
                  { value: 'no', label: 'No Image' }
                ]}
                placeholder="Image Setting (All)"
                fullWidth
              />
              <Select
                value={filterIsOptional}
                onChange={(e) => setFilterIsOptional(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status Types', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  { value: 'yes', label: 'Optional' },
                  { value: 'no', label: 'Required' }
                ]}
                placeholder="Status Type (All)"
                fullWidth
              />
              <Select
                value={filterIsFeatured}
                onChange={(e) => setFilterIsFeatured(e.target.value)}
                options={[
                  { value: 'all', label: 'All Featured Settings', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  { value: 'yes', label: 'Featured' },
                  { value: 'no', label: 'Not Featured' }
                ]}
                placeholder="Featured Setting (All)"
                fullWidth
              />
              <Select
                value={filterRequiresSubmission}
                onChange={(e) => setFilterRequiresSubmission(e.target.value)}
                options={[
                  { value: 'all', label: 'All Submission Settings', icon: getThemedIcon('ui', 'filter', 14, theme) },
                  { value: 'yes', label: 'Requires Submission' },
                  { value: 'no', label: 'No Submission' }
                ]}
                placeholder="Submission Setting (All)"
                fullWidth
              />
              <input
                type="text"
                placeholder="Search Activity ID"
                value={searchActivityId}
                onChange={(e) => setSearchActivityId(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
          </div>
        </CollapsibleDashboardSection>

        {/* Statistics Cards - Collapsible */}
        <CollapsibleDashboardSection
          sectionId="review-statistics"
          title="Statistics"
          icon={<BarChart3 size={20} />}
          color="#10b981"
          defaultMode="full"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            {
              type: 'total-results',
              value: stats.total || 0,
              suffix: '',
              tooltip: `Total number of ${mode} submissions${isInstructor && !isAdmin ? ' from your students' : ''}. This includes all attempts and retakes.`
            },
            {
              type: 'average-score',
              value: stats.average || 0,
              suffix: '%',
              tooltip: `Average score across all ${mode} submissions${isInstructor && !isAdmin ? ' from your students' : ''}. Calculated as the mean percentage score.`
            },
            {
              type: 'passed',
              value: stats.passed || 0,
              suffix: '',
              tooltip: `Number of ${mode} submissions with score ≥ 60%${isInstructor && !isAdmin ? ' from your students' : ''}. Passing threshold is 60%.`
            },
            {
              type: 'failed',
              value: stats.failed || 0,
              suffix: '',
              tooltip: `Number of ${mode} submissions with score < 60%${isInstructor && !isAdmin ? ' from your students' : ''}. These need attention.`
            },
            {
              type: 'pass-rate',
              value: stats.passRate || 0,
              suffix: '%',
              tooltip: `Percentage of ${mode} submissions that passed (≥60%)${isInstructor && !isAdmin ? ' from your students' : ''}. Higher is better.`
            },
            {
              type: 'excellent',
              value: stats.excellent || 0,
              suffix: '',
              tooltip: `Number of ${mode} submissions with score ≥ 90%${isInstructor && !isAdmin ? ' from your students' : ''}. Outstanding performance!`
            },
            {
              type: 'good',
              value: stats.good || 0,
              suffix: '',
              tooltip: `Number of ${mode} submissions with score between 70-89%${isInstructor && !isAdmin ? ' from your students' : ''}. Good performance.`
            },
            {
              type: 'needs-improvement',
              value: stats.needsImprovement || 0,
              suffix: '',
              tooltip: `Number of ${mode} submissions with score < 60%${isInstructor && !isAdmin ? ' from your students' : ''}. These students may need extra support.`
            },
            {
              type: 'unique-students',
              value: stats.uniqueStudents || 0,
              suffix: '',
              tooltip: `Number of unique students who submitted ${mode}${isInstructor && !isAdmin ? ' in your classes' : ''}. Each student is counted once regardless of attempts.`
            },
            {
              type: 'unique-quizzes',
              value: stats.uniqueActivities || 0,
              suffix: '',
              tooltip: `Number of unique ${mode} activities${isInstructor && !isAdmin ? ' in your classes' : ''}. Each activity is counted once.`
            }
          ].map((stat, idx) => {
            const config = getCardConfig(stat.type, t);
            const IconComponent = config.icon;
            const borderRadius = getShapeRadius(config.shape);

            return (
              <Card key={idx} style={{ position: 'relative', overflow: 'visible', zIndex: 1 }}>
                <CardBody style={{ position: 'relative', overflow: 'visible' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      padding: '0.75rem',
                      background: config.bg,
                      borderRadius: borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={24} style={{ color: config.iconColor }} />
                    </div>
                    <div style={{ flex: 1, position: 'relative', overflow: 'visible' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {config.label}
                        </span>
                        <div style={{ position: 'relative', zIndex: 10000 }}>
                          <InfoTooltip>
                            <div style={{ padding: '0.5rem', fontSize: '0.875rem', lineHeight: '1.5', maxWidth: '250px', whiteSpace: 'normal' }}>
                              {stat.tooltip}
                            </div>
                          </InfoTooltip>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: config.iconColor }}>
                        {stat.value}{stat.suffix}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
          </div>
        </CollapsibleDashboardSection>

        {/* Results Table */}
        <Card>
          <CardBody>
            {loading ? (
              <Loading message="Loading results..." fancyVariant="dots" />
            ) : (
              <AdvancedDataGrid
                rows={results}
                getRowId={(row) => row.docId || row.id}
                columns={columns}
                pageSize={25}
                pageSizeOptions={[10, 25, 50, 100]}
                checkboxSelection
                exportFileName={`${mode}-results`}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default ReviewResultsPage;


