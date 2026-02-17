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

const MarksPage = () => {
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
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
      
      // Extract students from enrollments
      const studentIds = [...new Set(enrollmentsRes.data?.map(e => e.userId).filter(Boolean) || [])];
      const uniqueStudents = studentIds.map(id => ({ 
        uid: id, 
        docId: id, 
        id: id,
        displayName: `Student ${id}`,
        email: `student${id}@example.com`
      }));
      setStudents(uniqueStudents);
      
    } catch (error) {
      logger.error('[MarksPage] Error loading data:', error);
      toast?.error?.(t('error_loading_data') || 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  const loadMarksDistribution = useCallback(async () => {
    if (!selectedSubject) return;
    
    try {
      const distribution = await getSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id);
      setMarksDistribution(distribution);
    } catch (error) {
      logger.error('[MarksPage] Error loading marks distribution:', error);
      toast?.error?.(t('error_loading_distribution') || 'Error loading marks distribution');
    }
  }, [selectedSubject, t, toast]);

  const loadStudentMarks = useCallback(async () => {
    if (!selectedSubject) return;
    
    try {
      const marks = await getStudentMarks(selectedSubject.docId || selectedSubject.id);
      setStudentMarks(marks);
    } catch (error) {
      logger.error('[MarksPage] Error loading student marks:', error);
      toast?.error?.(t('error_loading_marks') || 'Error loading student marks');
    }
  }, [selectedSubject, t, toast]);

  // Initial load with Global Loading
  useLayoutEffect(() => {
    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_marks') || 'Loading marks...' });
      await loadData(true);
      if (stopLoading) stopLoading();
      setLoading(false);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, [startLoading, loadData, t]);

  // Load marks data when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadMarksDistribution();
      loadStudentMarks();
    } else {
      setMarksDistribution(null);
      setStudentMarks({});
    }
  }, [selectedSubject, loadMarksDistribution, loadStudentMarks]);

  const filteredClasses = useMemo(() => {
    let result = [...classes];
    
    if (subjectFilter && c.subjectId !== subjectFilter) return false;
    if (programFilter) {
      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
      if (subject?.programId !== programFilter) return false;
    }
    return true;
  });

  const handleEditMarks = useCallback((student) => {
    setEditingStudent(student);
    const studentId = student.docId || student.id || student.uid;
    const marks = studentMarks[studentId] || {};
    setFormData({
      midTermExam: marks.midTermExam || 0,
      finalExam: marks.finalExam || 0,
      homework: marks.homework || 0,
      labsProjectResearch: marks.labsProjectResearch || 0,
      quizzes: marks.quizzes || 0,
      participation: marks.participation || 0,
      attendance: marks.attendance || 0
    });
    setShowModal(true);
  }, [studentMarks]);

  const columns = useMemo(() => [
    {
      field: 'studentName',
      headerName: t('user') || 'User',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        const student = students.find(s => (s.docId || s.id || s.uid) === rowId);
        const enrollment = enrollments.find(e => e.userId === rowId && e.subjectId === subjectFilter);
        
        if (!student) return rowId || 'Unknown';
        
        const filters = {
          programId: programFilter,
          subjectId: subjectFilter,
          classId: enrollment?.classId || ''
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                {student.displayName || student.realName || student.email || 'Unknown'}
              </div>
              <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {student.email || 'No email'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('penalty_type', 'cheating', 14, theme)}
                onClick={() => openSideWindow(RECORD_TYPES.PENALTY, student, filters)}
              >
                {t('penalties') || 'Penalties'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={getThemedIcon('behavior_type', 'disruptive', 14, theme)}
                onClick={() => openSideWindow(RECORD_TYPES.BEHAVIOR, student, filters)}
              >
                {t('behaviors') || 'Behaviors'}
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
          </div>
        );
      }
    },
    {
      field: 'midTermExam',
      headerName: t('mid_term') || 'Mid-Term',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.midTermExam || 20;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'finalExam',
      headerName: t('final') || 'Final',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.finalExam || 40;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'homework',
      headerName: t('homework') || 'Homework',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.homework || 5;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'labsProjectResearch',
      headerName: t('labs_projects_research') || 'Labs/Projects/Research',
      width: 150,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.labsProjectResearch || 10;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'quizzes',
      headerName: t('quizzes') || 'Quizzes',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.quizzes || 5;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'participation',
      headerName: t('participation') || 'Participation',
      width: 120,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.participation || 10;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'attendance',
      headerName: t('attendance') || 'Attendance',
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params) => {
        const value = params.value || 0;
        const maxMarks = marksDistribution?.attendance || 10;
        return (
          <div style={{ 
            padding: '4px 8px', 
            borderRadius: '4px',
            background: value >= maxMarks ? '#dc2626' : value >= maxMarks * 0.6 ? '#f59e0b' : '#10b981',
            color: 'white',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {value}/{maxMarks}
          </div>
        );
      }
    },
    {
      field: 'totalScore',
      headerName: t('total_score') || 'Total Score',
      width: 120,
      renderCell: (params) => {
        const row = params.row;
        const total = (row.midTermExam || 0) + (row.finalExam || 0) + (row.homework || 0) + 
                     (row.labsProjectResearch || 0) + (row.quizzes || 0) + (row.participation || 0) + 
                     (row.attendance || 0);
        const maxTotal = (marksDistribution?.midTermExam || 20) + (marksDistribution?.finalExam || 40) + 
                        (marksDistribution?.homework || 5) + (marksDistribution?.labsProjectResearch || 10) + 
                        (marksDistribution?.quizzes || 5) + (marksDistribution?.participation || 10) + 
                        (marksDistribution?.attendance || 10);
        const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
        
        let grade = 'F';
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ 
              padding: '4px 8px', 
              borderRadius: '4px',
              background: percentage >= 90 ? '#10b981' : percentage >= 70 ? '#3b82f6' : percentage >= 50 ? '#f59e0b' : '#ef4444',
              color: 'white',
              textAlign: 'center',
              fontWeight: 600,
              minWidth: '60px'
            }}>
              {total.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
              {grade} ({percentage.toFixed(1)}%)
            </div>
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
                  toast?.error?.(t('distribution_must_sum_100') || 'Distribution must sum to 100%');
                  return;
                }

                try {
                  await setSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id, distributionForm);
                  setMarksDistribution(distributionForm);
                  setEditingDistribution(false);
                  toast?.success?.(t('distribution_updated') || 'Distribution updated');
                  await logActivity({
                    type: ACTIVITY_LOG_TYPES.MARKS_DISTRIBUTION_UPDATED,
                    details: { subjectId: selectedSubject.docId || selectedSubject.id, distribution: distributionForm }
                  });
                } catch (error) {
                  logger.error('[MarksPage] Error updating distribution:', error);
                  toast?.error?.(t('error_updating_distribution') || 'Error updating distribution');
                }
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label>{t('mid_term') || 'Mid-Term'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.midTermExam}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, midTermExam: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('final') || 'Final'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.finalExam}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, finalExam: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('homework') || 'Homework'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.homework}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, homework: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('labs_projects_research') || 'Labs/Projects/Research'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.labsProjectResearch}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, labsProjectResearch: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('quizzes') || 'Quizzes'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.quizzes}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, quizzes: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('participation') || 'Participation'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.participation}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, participation: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <label>{t('attendance') || 'Attendance'} (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={distributionForm.attendance}
                    onChange={(e) => setDistributionForm(prev => ({ ...prev, attendance: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {t('total') || 'Total'}: {(
                    (distributionForm.midTermExam || 0) +
                    (distributionForm.finalExam || 0) +
                    (distributionForm.homework || 0) +
                    (distributionForm.labsProjectResearch || 0) +
                    (distributionForm.quizzes || 0) +
                    (distributionForm.participation || 0) +
                    (distributionForm.attendance || 0)
                  )}%
                </div>
                <Button type="submit" variant="primary">
                  {t('save') || 'Save'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {selectedSubject && (
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>
                {t('student_marks') || 'Student Marks'} - {selectedSubject.name || selectedSubject.nameAr || selectedSubject.code}
              </h3>
            </div>
            
            {loading ? (
              <SimpleLoading loading type="spinner" size="md" />
            ) : (
              <AdvancedDataGrid
                rows={students.map(student => {
                  const studentId = student.docId || student.id || student.uid;
                  const marks = studentMarks[studentId] || {};
                  return {
                    id: studentId,
                    docId: studentId,
                    studentName: student.displayName || student.realName || student.email,
                    midTermExam: marks.midTermExam || 0,
                    finalExam: marks.finalExam || 0,
                    homework: marks.homework || 0,
                    labsProjectResearch: marks.labsProjectResearch || 0,
                    quizzes: marks.quizzes || 0,
                    participation: marks.participation || 0,
                    attendance: marks.attendance || 0,
                    totalScore: (marks.midTermExam || 0) + (marks.finalExam || 0) + (marks.homework || 0) + 
                               (marks.labsProjectResearch || 0) + (marks.quizzes || 0) + (marks.participation || 0) + 
                               (marks.attendance || 0)
                  };
                })}
                columns={columns}
                getRowId={(row) => row.docId || row.id}
                processRowUpdate={async (newRow) => {
                  try {
                    await saveStudentMarks(selectedSubject.docId || selectedSubject.id, {
                      userId: newRow.docId || newRow.id,
                      midTermExam: newRow.midTermExam,
                      finalExam: newRow.finalExam,
                      homework: newRow.homework,
                      labsProjectResearch: newRow.labsProjectResearch,
                      quizzes: newRow.quizzes,
                      participation: newRow.participation,
                      attendance: newRow.attendance
                    });
                    
                    setStudentMarks(prev => ({
                      ...prev,
                      [newRow.docId || newRow.id]: {
                        userId: newRow.docId || newRow.id,
                        midTermExam: newRow.midTermExam,
                        finalExam: newRow.finalExam,
                        homework: newRow.homework,
                        labsProjectResearch: newRow.labsProjectResearch,
                        quizzes: newRow.quizzes,
                        participation: newRow.participation,
                        attendance: newRow.attendance
                      }
                    }));
                    
                    toast?.success?.(t('marks_updated') || 'Marks updated');
                    await logActivity({
                      type: ACTIVITY_LOG_TYPES.MARKS_UPDATED,
                      details: { 
                        subjectId: selectedSubject.docId || selectedSubject.id, 
                        studentId: newRow.docId || newRow.id,
                        marks: newRow
                      }
                    });
                  } catch (error) {
                    logger.error('[MarksPage] Error saving marks:', error);
                    toast?.error?.(t('error_saving_marks') || 'Error saving marks');
                  }
                }}
              />
            )}
          </CardBody>
        </Card>
      )}

      <CollapsibleSideWindow
        isOpen={sideWindowOpen}
        onClose={closeSideWindow}
        title={(() => {
          switch (sideWindowContent) {
            case RECORD_TYPES.BEHAVIOR: return t('behavior_records') || 'Behavior Records';
            case RECORD_TYPES.PENALTY: return t('penalty_records') || 'Penalty Records';
            case RECORD_TYPES.PARTICIPATION: return t('participation_records') || 'Participation Records';
            case 'sneakpeek': return t('student_overview') || 'Student Overview';
            default: return '';
          }
        })()}
      >
        {renderSideWindowContent()}
      </CollapsibleSideWindow>
    </Container>
  );
};

export default MarksPage;
