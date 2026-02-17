import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getSubjects, getPrograms } from '@services/business/programService';
import {
  getSubjectMarksDistribution,
  setSubjectMarksDistribution,
  getStudentMarks,
  saveStudentMarks
} from '@services/business/enrollmentMarksService';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getClasses } from '@services/business/classService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger.jsx';
import { MARK_TYPES } from '@constants/activityTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { USER_ROLES } from '@constants/userRoles';
import { SimpleLoading, Modal, Button, Input, Select, useToast, AdvancedDataGrid, Card, CardBody, Container } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { ProgramsSelect } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { CollapsibleSideWindow } from '@ui';
import BehaviorPage from '../../../operations/behavior/BehaviorPage';
import PenaltiesPage from '../../../operations/penalty/PenaltiesPage';
import ParticipationPage from '../../../operations/participation/ParticipationPage';
import styles from './EnrollmentsMarksPage.module.css';

const EnrollmentsMarksPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [marksDistribution, setMarksDistribution] = useState(null);
  const [studentMarks, setStudentMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    midTermExam: 0,
    finalExam: 0,
    homework: 0,
    labsProjectResearch: 0,
    quizzes: 0,
    participation: 0,
    attendance: 0
  });
  const [editingDistribution, setEditingDistribution] = useState(false);
  const [distributionForm, setDistributionForm] = useState({
    midTermExam: 20,
    finalExam: 40,
    homework: 5,
    labsProjectResearch: 10,
    quizzes: 5,
    participation: 10,
    attendance: 10
  });

  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Side window state
  const [sideWindowOpen, setSideWindowOpen] = useState(false);
  const [sideWindowContent, setSideWindowContent] = useState(null);
  const [sideWindowStudent, setSideWindowStudent] = useState(null);
  const [sideWindowFilters, setSideWindowFilters] = useState({});

  const selectedSubject = useMemo(() => {
    if (subjectFilter === '') return null;
    return subjects.find((s) => (s.docId || s.id) === subjectFilter) || null;
  }, [subjectFilter, subjects]);

  // Memoized normalize Select onChange
  const getSelectValue = useCallback((eventOrValue) => {
    if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
      return eventOrValue.target?.value ?? '';
    }
    return eventOrValue ?? '';
  }, []);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [programsRes, subjectsRes, classesRes, enrollmentsRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getEnrollments()
      ]);

      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) {
        let subjectsList = subjectsRes.data || [];
        if (isInstructor && !isAdmin && !isSuperAdmin) {
          subjectsList = subjectsList.filter(s => s.instructorId === user?.uid);
        }
        setSubjects(subjectsList);
      }
      if (classesRes.success) setClasses(classesRes.data || []);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);

      const usersResult = await getUsers();
      if (usersResult.success) {
        const studentsList = (usersResult.data || []).filter(u => u.role === USER_ROLES.STUDENT);
        setStudents(studentsList);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [toast, isInstructor, isAdmin, isSuperAdmin, user]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!isAdmin && !isSuperAdmin && !isInstructor) return;

    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_marks_data') || 'Loading marks data...' });
      await loadData(true);
      if (stopLoading) stopLoading();
      setLoading(false);
      logActivity(ACTIVITY_LOG_TYPES.MARK_ENTRY_VIEWED);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, [authLoading, isAdmin, isSuperAdmin, isInstructor, startLoading, loadData, t]);

  const loadMarksData = useCallback(async () => {
    if (!selectedSubject) return;
    
    setLoading(true);
    try {
      const distResult = await getSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id);
      if (distResult.success && distResult.data) {
        setMarksDistribution(distResult.data.distribution || distResult.data);
      } else {
        setMarksDistribution({
          midTermExam: 20,
          finalExam: 40,
          homework: 5,
          labsProjectResearch: 10,
          quizzes: 5,
          participation: 10,
          attendance: 10,
        });
      }

      if (classFilter !== '') {
        const marksResult = await getStudentMarks(null, selectedSubject.docId || selectedSubject.id, classFilter);
        if (marksResult.success) {
          const marksMap = {};
          marksResult.data.forEach(m => { marksMap[m.studentId] = m; });
          setStudentMarks(marksMap);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, classFilter, toast]);

  useEffect(() => {
    if (subjectFilter !== '' && classFilter !== '') {
      loadMarksData();
    }
  }, [subjectFilter, classFilter, loadMarksData]);

  const filteredClasses = useMemo(() => {
    let result = [...classes];
    if (programFilter !== '') {
      result = result.filter(cls => {
        const sub = subjects.find(s => (s.docId || s.id) === cls.subjectId);
        return sub && sub.programId === programFilter;
      });
    }
    if (subjectFilter !== '') {
      result = result.filter(cls => cls.subjectId === subjectFilter);
    }
    return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [classes, subjects, programFilter, subjectFilter]);

  const studentsWithMarks = useMemo(() => {
    if (classFilter === '') return [];
    const classEnrollments = enrollments.filter(e => e.classId === classFilter);
    return classEnrollments.map(e => {
      const student = students.find(s => s.uid === e.userId);
      if (!student) return null;
      const studentId = student.uid || student.docId || student.id;
      return {
        ...student,
        id: studentId,
        displayName: student.displayName || student.fullName || student.realName || student.email,
        email: student.email,
        marks: studentMarks[studentId] || {}
      };
    }).filter(Boolean);
  }, [classFilter, enrollments, students, studentMarks]);

  const handleEditMarks = useCallback((student) => {
    setEditingStudent(student);
    const studentId = student.uid || student.docId || student.id;
    const existing = studentMarks[studentId];
    setFormData({
      midTermExam: existing?.marks?.midTermExam || 0,
      finalExam: existing?.marks?.finalExam || 0,
      homework: existing?.marks?.homework || 0,
      labsProjectResearch: existing?.marks?.labsProjectResearch || 0,
      quizzes: existing?.marks?.quizzes || 0,
      participation: existing?.marks?.participation || 0,
      attendance: existing?.marks?.attendance || 0
    });
    setShowModal(true);
  }, [studentMarks]);

  const calculateTotalScore = useCallback(() => {
    if (!marksDistribution) return 0;
    return (
      (formData.midTermExam * (marksDistribution.midTermExam || 0)) / 100 +
      (formData.finalExam * (marksDistribution.finalExam || 0)) / 100 +
      (formData.homework * (marksDistribution.homework || 0)) / 100 +
      (formData.labsProjectResearch * (marksDistribution.labsProjectResearch || 0)) / 100 +
      (formData.quizzes * (marksDistribution.quizzes || 0)) / 100 +
      (formData.participation * (marksDistribution.participation || 0)) / 100 +
      (formData.attendance * (marksDistribution.attendance || 0)) / 100
    );
  }, [formData, marksDistribution]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!editingStudent || !selectedSubject || classFilter === '') return;
    
    setLoading(true);
    try {
      const result = await saveStudentMarks({
        studentId: editingStudent.uid || editingStudent.docId,
        subjectId: selectedSubject.docId || selectedSubject.id,
        classId: classFilter,
        marks: formData,
        instructorId: user.uid,
        sendEmailNotification: false,
        sendInAppNotification: false,
      });

      if (result.success) {
        toast.success(t('marks_saved_successfully'));
        setShowModal(false);
        loadMarksData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [editingStudent, selectedSubject, classFilter, formData, user, toast, t, loadMarksData, calculateTotalScore]);

  const columns = useMemo(() => [
    {
      field: 'displayName',
      headerName: t('student') || 'Student',
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.row.displayName || params.row.email || '-'
    },
    {
      field: 'email',
      headerName: t('email') || 'Email',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'midTerm',
      headerName: `${t('mid_term_exam') || 'Mid-Term'} (${marksDistribution?.midTermExam || 20}%)`,
      width: 140,
      renderCell: (params) => params.row.marks?.marks?.midTermExam ?? '-'
    },
    {
      field: 'final',
      headerName: `${t('final_exam') || 'Final'} (${marksDistribution?.finalExam || 40}%)`,
      width: 120,
      renderCell: (params) => params.row.marks?.marks?.finalExam ?? '-'
    },
    {
      field: 'homework',
      headerName: `${t('homework') || 'Homework'} (${marksDistribution?.homework || 5}%)`,
      width: 140,
      renderCell: (params) => params.row.marks?.marks?.homework ?? '-'
    },
    {
      field: 'labs',
      headerName: `${t('labs_projects') || 'Labs/Projects'} (${marksDistribution?.labsProjectResearch || 10}%)`,
      width: 150,
      renderCell: (params) => params.row.marks?.marks?.labsProjectResearch ?? '-'
    },
    {
      field: 'quizzes',
      headerName: `${t('quizzes') || 'Quizzes'} (${marksDistribution?.quizzes || 5}%)`,
      width: 120,
      renderCell: (params) => params.row.marks?.marks?.quizzes ?? '-'
    },
    {
      field: RECORD_TYPES.PARTICIPATION,
      headerName: `${t('participation') || 'Participation'} (${marksDistribution?.participation || 10}%)`,
      width: 140,
      renderCell: (params) => params.row.marks?.marks?.participation ?? '-'
    },
    {
      field: RECORD_TYPES.ATTENDANCE,
      headerName: `${t('attendance') || 'Attendance'} (${marksDistribution?.attendance || 10}%)`,
      width: 140,
      renderCell: (params) => params.row.marks?.marks?.attendance ?? '-'
    },
    {
      field: 'total',
      headerName: t('total') || 'Total',
      width: 100,
      renderCell: (params) => params.row.marks?.totalScore?.toFixed?.(2) || '-'
    },
    {
      field: 'grade',
      headerName: t('grade') || 'Grade',
      width: 100,
      renderCell: (params) => {
        const grade = params.row.marks?.grade;
        const isRetake = params.row.marks?.isRetake;
        if (!grade) return '-';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700 }}>{grade}</span>
            {isRetake && <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>({t('retake') || 'Retake'})</span>}
          </div>
        );
      }
    },
    {
      field: 'actions',
      headerName: t('actions') || 'Actions',
      width: 320,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const student = params.row;
        const classItem = classes.find(c => String(c.id || c.docId) === String(classFilter));
        const subject = subjects.find(s => (s.docId || s.id) === subjectFilter);
        const program = subject ? programs.find(p => (p.docId || p.id) === subject.programId) : null;

        const filters = {
          programId: program?.docId || program?.id || 'all',
          subjectId: subject?.docId || subject?.id || 'all',
          classId: classFilter,
          studentId: student.uid || student.docId || student.id,
        };

        return (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="sm"
              icon={getThemedIcon('ui', 'edit', 14, theme)}
              onClick={() => handleEditMarks(student)}
            >
              {t('edit') || 'Edit'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={getThemedIcon('ui', 'alert_triangle', 14, theme)}
              onClick={() => openSideWindow(RECORD_TYPES.BEHAVIOR, student, filters)}
            >
              {t('behavior') || 'Behavior'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={getThemedIcon('ui', 'award', 14, theme)}
              onClick={() => openSideWindow(RECORD_TYPES.PENALTY, student, filters)}
            >
              {t('penalties') || 'Penalties'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={getThemedIcon('ui', 'award', 14, theme)}
              onClick={() => openSideWindow(RECORD_TYPES.PARTICIPATION, student, filters)}
            >
              {t('participation') || 'Participation'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={getThemedIcon('ui', 'eye', 14, theme)}
              onClick={() => openSideWindow('sneakpeek', student, filters)}
            >
              {t('peek') || 'Peek'}
            </Button>
          </div>
        );
      }
    }
  ], [t, marksDistribution, classes, classFilter, subjects, subjectFilter, programs, handleEditMarks, getThemedIcon, theme]);

  if (authLoading) return <GlobalLoadingFallback />;
  if (!isAdmin && !isSuperAdmin && !isInstructor) return <Navigate to="/" replace />;

  const renderSideWindowContent = () => {
    if (!sideWindowContent || !sideWindowStudent) return null;
    switch (sideWindowContent) {
      case RECORD_TYPES.BEHAVIOR:
        return (
          <BehaviorPage
            isDashboardTab
            initialFilters={sideWindowFilters}
            hideActions
          />
        );
      case RECORD_TYPES.PENALTY:
        return (
          <PenaltiesPage
            isDashboardTab
            initialFilters={sideWindowFilters}
            hideActions
          />
        );
      case RECORD_TYPES.PARTICIPATION:
        return (
          <ParticipationPage
            isDashboardTab
            initialFilters={sideWindowFilters}
            hideActions
          />
        );
      case 'sneakpeek':
        return (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>{t('student_overview') || 'Student Overview'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong>{t('name') || 'Name'}:</strong> {sideWindowStudent.displayName || sideWindowStudent.email}
              </div>
              <div>
                <strong>{t('email') || 'Email'}:</strong> {sideWindowStudent.email}
              </div>
              {(() => {
                const studentId = sideWindowStudent.uid || sideWindowStudent.docId || sideWindowStudent.id;
                const marks = studentMarks[studentId];
                return marks && (
                  <div>
                    <strong>{t('current_marks') || 'Current Marks'}:</strong>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div>{t('total_score') || 'Total Score'}: {marks.totalScore?.toFixed?.(2) || 0}</div>
                      <div>{t('grade') || 'Grade'}: {marks.grade || 'N/A'}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const openSideWindow = (content, student, filters) => {
    setSideWindowContent(content);
    setSideWindowStudent(student);
    setSideWindowFilters(filters);
    setSideWindowOpen(true);
  };

  const closeSideWindow = () => {
    setSideWindowOpen(false);
    setSideWindowContent(null);
    setSideWindowStudent(null);
    setSideWindowFilters({});
  };

  return (
    <Container maxWidth="xl" className={styles.page} style={{ padding: '1rem 0' }}>
      <Card style={{ marginBottom: '1rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {getThemedIcon('ui', 'info', 20, theme)}
            <span style={{ fontSize: '0.9rem', color: '#92400e' }}>
              <strong>Note:</strong> {t('note_marks_no_notifications') || 'Marks entered here will not send any notifications to students. This is for manual entry only.'}
            </span>
          </div>
        </CardBody>
      </Card>

      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <ProgramsSelect
              programs={programs}
              subjects={subjects}
              classes={filteredClasses}
              selectedProgram={programFilter}
              selectedSubject={subjectFilter}
              selectedClass={classFilter}
              onProgramChange={(val) => { setProgramFilter(val); setSubjectFilter(''); setClassFilter(''); }}
              onSubjectChange={(val) => { setSubjectFilter(val); setClassFilter(''); }}
              onClassChange={(val) => setClassFilter(val)}
              showLabels={false}
              fullWidth
            />
          </div>
        </CardBody>
      </Card>

      {selectedSubject && marksDistribution && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>{t('marks_distribution') || 'Marks Distribution'}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDistributionForm({
                    midTermExam: marksDistribution.midTermExam || 20,
                    finalExam: marksDistribution.finalExam || 40,
                    homework: marksDistribution.homework || 5,
                    labsProjectResearch: marksDistribution.labsProjectResearch || 10,
                    quizzes: marksDistribution.quizzes || 5,
                    participation: marksDistribution.participation || 10,
                    attendance: marksDistribution.attendance || 10,
                  });
                  setEditingDistribution(true);
                }}
              >
                {t('configure') || 'Configure'}
              </Button>
            </div>
            <div className={styles.distributionGrid}>
              <div>{t('mid_term') || 'Mid-Term'}: {marksDistribution.midTermExam}%</div>
              <div>{t('final') || 'Final'}: {marksDistribution.finalExam}%</div>
              <div>{t('homework') || 'Homework'}: {marksDistribution.homework}%</div>
              <div>{t('labs_projects_research') || 'Labs/Projects/Research'}: {marksDistribution.labsProjectResearch}%</div>
              <div>{t('quizzes') || 'Quizzes'}: {marksDistribution.quizzes}%</div>
              <div>{t('participation') || 'Participation'}: {marksDistribution.participation}%</div>
              <div>{t('attendance') || 'Attendance'}: {marksDistribution.attendance}%</div>
              <div style={{ fontWeight: 600 }}>{t('total') || 'Total'}: {(
                (marksDistribution.midTermExam || 0) +
                (marksDistribution.finalExam || 0) +
                (marksDistribution.homework || 0) +
                (marksDistribution.labsProjectResearch || 0) +
                (marksDistribution.quizzes || 0) +
                (marksDistribution.participation || 0) +
                (marksDistribution.attendance || 0)
              )}%</div>
            </div>
          </CardBody>
        </Card>
      )}

      {editingDistribution && selectedSubject && (
        <Card style={{ marginBottom: '1rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>{t('edit_marks_distribution') || 'Edit Marks Distribution'}</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingDistribution(false)}>
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const total = (
                  (distributionForm.midTermExam || 0) +
                  (distributionForm.finalExam || 0) +
                  (distributionForm.homework || 0) +
                  (distributionForm.labsProjectResearch || 0) +
                  (distributionForm.quizzes || 0) +
                  (distributionForm.participation || 0) +
                  (distributionForm.attendance || 0)
                );
                if (Math.abs(total - 100) > 0.01) {
                  toast.error(t('total_must_equal_100') || 'Total must equal 100%');
                  return;
                }
                setLoading(true);
                try {
                  const result = await setSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id, distributionForm);
                  if (result.success) {
                    toast.success(t('marks_distribution_updated_successfully') || 'Marks distribution updated successfully');
                    setEditingDistribution(false);
                    loadMarksData();
                  } else {
                    toast.error(result.error || t('failed_to_update_distribution') || 'Failed to update distribution');
                  }
                } catch (error) {
                  toast.error(error.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="dashboard-form"
            >
              <div className="form-row">
                <Input label={`${t('mid_term_exam') || 'Mid-Term Exam'} (%)`} type="number" value={distributionForm.midTermExam} onChange={(e) => setDistributionForm({ ...distributionForm, midTermExam: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
                <Input label={`${t('final_exam') || 'Final Exam'} (%)`} type="number" value={distributionForm.finalExam} onChange={(e) => setDistributionForm({ ...distributionForm, finalExam: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
                <Input label={`${t('homework') || 'Homework'} (%)`} type="number" value={distributionForm.homework} onChange={(e) => setDistributionForm({ ...distributionForm, homework: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
                <Input label={`${t('labs_projects_research') || 'Labs/Projects/Research'} (%)`} type="number" value={distributionForm.labsProjectResearch} onChange={(e) => setDistributionForm({ ...distributionForm, labsProjectResearch: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
                <Input label={`${t('quizzes') || 'Quizzes'} (%)`} type="number" value={distributionForm.quizzes} onChange={(e) => setDistributionForm({ ...distributionForm, quizzes: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
                <Input label={`${t('participation') || 'Participation'} (%)`} type="number" value={distributionForm.participation} onChange={(e) => setDistributionForm({ ...distributionForm, participation: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
                <Input label={`${t('attendance') || 'Attendance'} (%)`} type="number" value={distributionForm.attendance} onChange={(e) => setDistributionForm({ ...distributionForm, attendance: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <strong>{t('total') || 'Total'}: {(
                  (distributionForm.midTermExam || 0) +
                  (distributionForm.finalExam || 0) +
                  (distributionForm.homework || 0) +
                  (distributionForm.labsProjectResearch || 0) +
                  (distributionForm.quizzes || 0) +
                  (distributionForm.participation || 0) +
                  (distributionForm.attendance || 0)
                ).toFixed(1)}%</strong>
                {Math.abs((
                  (distributionForm.midTermExam || 0) +
                  (distributionForm.finalExam || 0) +
                  (distributionForm.homework || 0) +
                  (distributionForm.labsProjectResearch || 0) +
                  (distributionForm.quizzes || 0) +
                  (distributionForm.participation || 0) +
                  (distributionForm.attendance || 0)
                ) - 100) > 0.01 && (
                  <p style={{ color: '#dc2626', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                    {t('total_must_equal_100') || 'Total must equal 100%'}
                  </p>
                )}
              </div>
              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || Math.abs((
                    (distributionForm.midTermExam || 0) +
                    (distributionForm.finalExam || 0) +
                    (distributionForm.homework || 0) +
                    (distributionForm.labsProjectResearch || 0) +
                    (distributionForm.quizzes || 0) +
                    (distributionForm.participation || 0) +
                    (distributionForm.attendance || 0)
                  ) - 100) > 0.01}
                >
                  {loading ? (t('saving') || 'Saving...') : (t('save_distribution') || 'Save Distribution')}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          {classFilter && subjectFilter ? (
            studentsWithMarks.length > 0 ? (
              <AdvancedDataGrid
                rows={studentsWithMarks}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.id || row.docId || row.uid || row.studentId}
                pageSize={20}
                autoHeight
                showExportButton
                exportFileName="marks"
                exportLabel={t('export') || 'Export'}
                loadingOverlayMessage={loading ? (t('loading_student_marks') || 'Loading student marks...') : undefined}
                disableSelectionOnClick
                disableColumnMenu
                disableDensitySelector
                disableColumnFilter
                disableColumnSelector
              />
            ) : (
              <div className={styles.emptyState}>
                {t('no_students_enrolled') || 'No students enrolled in this class.'}
              </div>
            )
          ) : (
            <div className={styles.emptyState}>
              {t('select_program_subject_class') || 'Please select a program, subject, and class to view and enter marks.'}
            </div>
          )}
        </CardBody>
      </Card>

      {showModal && editingStudent && marksDistribution && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingStudent(null); }}
          title={`${t('enter_marks') || 'Enter Marks'}: ${editingStudent.displayName || editingStudent.email}`}
        >
          <form onSubmit={handleSubmit} className={`${styles.form} dashboard-form`}>
            <div className={`${styles.marksGrid} form-row`}>
              <Input label={`${t('mid_term_exam') || 'Mid-Term Exam'} (${marksDistribution.midTermExam}%)`} type="number" value={formData.midTermExam} onChange={(e) => setFormData({ ...formData, midTermExam: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
              <Input label={`${t('final_exam') || 'Final Exam'} (${marksDistribution.finalExam}%)`} type="number" value={formData.finalExam} onChange={(e) => setFormData({ ...formData, finalExam: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
              <Input label={`${t('homework') || 'Homework'} (${marksDistribution.homework}%)`} type="number" value={formData.homework} onChange={(e) => setFormData({ ...formData, homework: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
              <Input label={`${t('labs_projects') || 'Labs/Projects'} (${marksDistribution.labsProjectResearch}%)`} type="number" value={formData.labsProjectResearch} onChange={(e) => setFormData({ ...formData, labsProjectResearch: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
              <Input label={`${t('quizzes') || 'Quizzes'} (${marksDistribution.quizzes}%)`} type="number" value={formData.quizzes} onChange={(e) => setFormData({ ...formData, quizzes: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
              <Input label={`${t('participation') || 'Participation'} (${marksDistribution.participation}%)`} type="number" value={formData.participation} onChange={(e) => setFormData({ ...formData, participation: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
              <Input label={`${t('attendance') || 'Attendance'} (${marksDistribution.attendance}%)`} type="number" value={formData.attendance} onChange={(e) => setFormData({ ...formData, attendance: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.5} />
            </div>

            <div className={styles.totalScore}>
              {getThemedIcon('ui', 'award', 20, theme)}
              <span>{t('calculated_total_score') || 'Calculated Total Score'}:</span>
              <strong>{calculateTotalScore().toFixed(2)}</strong>
              <span>/ 100</span>
            </div>

            <div className={`${styles.actions} form-actions`}>
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); setEditingStudent(null); }}>
                {t('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" variant="primary" icon={getThemedIcon('ui', 'save', 18, theme)} disabled={loading}>
                {loading ? (t('saving') || 'Saving...') : (t('save_marks') || 'Save Marks')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <CollapsibleSideWindow
        isOpen={sideWindowOpen}
        onClose={closeSideWindow}
        title={sideWindowContent === RECORD_TYPES.BEHAVIOR ? (t('behavior') || 'Behavior') :
              sideWindowContent === RECORD_TYPES.PENALTY ? (t('penalties') || 'Penalties') :
              sideWindowContent === RECORD_TYPES.PARTICIPATION ? (t('participation') || 'Participation') : (t('student_overview') || 'Student Overview')}
        studentName={sideWindowStudent?.displayName || sideWindowStudent?.email || (t('student') || 'Student')}
        searchable={false}
        initialFilters={sideWindowFilters}
      >
        {renderSideWindowContent()}
      </CollapsibleSideWindow>
    </Container>
  );
};

export default EnrollmentsMarksPage;
