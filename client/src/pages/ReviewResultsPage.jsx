import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Container, Card, CardBody, Button, Select, Loading, Badge, useToast, AdvancedDataGrid } from '../components/ui';
import InfoTooltip from '../components/ui/InfoTooltip/InfoTooltip';
import { Info } from 'lucide-react';
import { getPrograms, getSubjects } from '../firebase/programs';
import { getClasses, getActivities } from '../firebase/firestore';
import { getCardConfig, getShapeRadius } from '../utils/cardColors';
import styles from './QuizResultsPage.module.css';

const ReviewResultsPage = () => {
  const { user, isAdmin, isInstructor, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
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

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, mode]);

  useEffect(() => {
    if (user && programs.length > 0) {
      loadResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActivity, selectedProgram, selectedSubject, selectedClass, selectedStudent, mode, user]);

  const loadData = async () => {
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
        const enrollmentsSnap = await getDocs(
          query(collection(db, 'enrollments'), where('classId', 'in', accessibleClassIds.slice(0, 10)))
        );
        const studentIds = new Set(enrollmentsSnap.docs.map(d => d.data().userId).filter(Boolean));
        const studentsData = await Promise.all(
          Array.from(studentIds).slice(0, 50).map(async (studentId) => {
            try {
              const studentDoc = await getDoc(doc(db, 'users', studentId));
              if (studentDoc.exists()) {
                return { id: studentId, docId: studentId, ...studentDoc.data() };
              }
            } catch (err) {
              console.warn('Failed to load student:', studentId, err);
            }
            return null;
          })
        );
        setStudents(studentsData.filter(Boolean));
      } else {
        const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const studentsData = studentsSnap.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() }));
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    setLoading(true);
    try {
      // Load submissions based on mode
      let collectionName = 'quizSubmissions'; // Default for quiz mode
      if (mode === 'homework' || mode === 'training' || mode === 'labandproject') {
        // For homework, training, and labandproject, we might use a different collection or filter by activity type
        collectionName = 'submissions'; // Assuming there's a general submissions collection
      }

      let q;
      try {
        if (selectedActivity !== 'all') {
          q = query(
            collection(db, collectionName),
            where('activityId', '==', selectedActivity),
            orderBy('submittedAt', 'desc')
          );
        } else {
          q = query(collection(db, collectionName), orderBy('submittedAt', 'desc'));
        }
      } catch (orderByError) {
        console.warn('OrderBy failed, trying without:', orderByError);
        if (selectedActivity !== 'all') {
          q = query(collection(db, collectionName), where('activityId', '==', selectedActivity));
        } else {
          q = query(collection(db, collectionName));
        }
      }
      
      const resultsSnap = await getDocs(q);
      let resultsData = resultsSnap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          docId: d.id, 
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
              console.warn('Failed to load activity:', result.activityId, err);
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
              console.warn('Failed to load student:', result.userId, err);
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
              console.warn('Failed to load class:', classId, err);
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
              console.warn('Failed to load subject:', enrichedResult.classSubjectId, err);
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
              console.warn('Failed to load program:', enrichedResult.subjectProgramId, err);
            }
          }
        } catch (err) {
          console.warn('Failed to enrich result:', err);
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
      console.error('Failed to load results:', error);
      toast?.error?.('Failed to load results: ' + error.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

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
      <Container>
        <Loading message="Loading results..." fancyVariant="dots" />
      </Container>
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
      <div style={{ marginBottom: '2rem' }}>
        {/* Mode Selector */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardBody>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>Review Results - {modeLabels[mode] || 'Quiz'}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant={mode === 'quiz' ? 'primary' : 'ghost'}
                  onClick={() => navigate('/review-results?mode=quiz')}
                >
                  Quiz
                </Button>
                <Button
                  variant={mode === 'homework' ? 'primary' : 'ghost'}
                  onClick={() => navigate('/review-results?mode=homework')}
                >
                  Homework
                </Button>
                <Button
                  variant={mode === 'training' ? 'primary' : 'ghost'}
                  onClick={() => navigate('/review-results?mode=training')}
                >
                  Training
                </Button>
                <Button
                  variant={mode === 'labandproject' ? 'primary' : 'ghost'}
                  onClick={() => navigate('/review-results?mode=labandproject')}
                >
                  Lab & Project
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Filters first so cards react immediately to selections */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardBody>
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
                  { value: 'all', label: 'All Programs' },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId
                  }))
                ]}
                placeholder="Filter by Program"
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
                  { value: 'all', label: 'All Subjects' },
                  ...subjects
                    .filter(s => selectedProgram === 'all' || s.programId === selectedProgram)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim()
                    }))
                ]}
                placeholder="Filter by Subject"
                fullWidth
              />
              <Select
                searchable
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={[
                  { value: 'all', label: 'All Classes' },
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
                placeholder="Filter by Class"
                fullWidth
              />
              <Select
                searchable
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                options={[
                  { value: 'all', label: `All ${modeLabels[mode]}s` },
                  ...filteredActivities.map(a => ({
                    value: a.id || a.docId,
                    label: a.title_en || a.title_ar || a.title || a.id
                  }))
                ]}
                placeholder={`Filter by ${modeLabels[mode]}`}
                fullWidth
              />
              <Select
                searchable
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                options={[
                  { value: 'all', label: 'All Students' },
                  ...students.map(s => ({
                    value: s.id || s.docId,
                    label: `${s.displayName || s.email}${s.email ? ` (${s.email})` : ''}`
                  }))
                ]}
                placeholder="Filter by Student"
                fullWidth
              />
              <Select
                value={filterRetake}
                onChange={(e) => setFilterRetake(e.target.value)}
                options={[
                  { value: 'all', label: 'All Retake Settings' },
                  { value: 'yes', label: 'Retake Allowed' },
                  { value: 'no', label: 'No Retake' }
                ]}
                placeholder="Retake"
                fullWidth
              />
              <Select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                options={[
                  { value: 'all', label: 'All Difficulties' },
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                placeholder="Difficulty"
                fullWidth
              />
              <Select
                value={filterHasImage}
                onChange={(e) => setFilterHasImage(e.target.value)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'yes', label: 'Has Image' },
                  { value: 'no', label: 'No Image' }
                ]}
                placeholder="Has Image"
                fullWidth
              />
              <Select
                value={filterIsOptional}
                onChange={(e) => setFilterIsOptional(e.target.value)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'yes', label: 'Optional' },
                  { value: 'no', label: 'Required' }
                ]}
                placeholder="Optional"
                fullWidth
              />
              <Select
                value={filterIsFeatured}
                onChange={(e) => setFilterIsFeatured(e.target.value)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'yes', label: 'Featured' },
                  { value: 'no', label: 'Not Featured' }
                ]}
                placeholder="Featured"
                fullWidth
              />
              <Select
                value={filterRequiresSubmission}
                onChange={(e) => setFilterRequiresSubmission(e.target.value)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'yes', label: 'Requires Submission' },
                  { value: 'no', label: 'No Submission' }
                ]}
                placeholder="Requires Submission"
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
          </CardBody>
        </Card>

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
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

