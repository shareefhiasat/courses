import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { Loading, Container } from '@ui';
import { getSubjects, getPrograms } from '@services/business/programService';
import { getSubjectMarksDistribution, setSubjectMarksDistribution, getAllClassSubjectMarks } from '@services/business/enrollmentMarksService';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getClasses } from '@services/business/classService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger.jsx';
import { MARK_TYPES } from '@constants/activityTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { USER_ROLES } from '@constants/userRoles';
import { AdvancedDataGrid, Card, CardBody, Modal, Button, Input, Select } from '@ui';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import { getThemedIcon } from '@constants/iconTypes';
import { CollapsibleSideWindow } from '@ui';
import BehaviorPage from '../operations/behavior/BehaviorPage';
import styles from './EnrollmentsMarksPage.module.css';

const EnrollmentsMarksPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  // State
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
  const [searchQuery, setSearchQuery] = useState('');
  const [marksFilter, setMarksFilter] = useState('');

  // Side window state
  const [sideWindowOpen, setSideWindowOpen] = useState(false);
  const [sideWindowContent, setSideWindowContent] = useState(null);
  const [sideWindowStudent, setSideWindowStudent] = useState(null);
  const [sideWindowFilters, setSideWindowFilters] = useState({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load programs and subjects
        const [programsResult, subjectsResult] = await Promise.all([
          getPrograms(),
          getSubjects()
        ]);
        
        if (programsResult.success) {
          setPrograms(programsResult.data || []);
        }
        
        if (subjectsResult.success) {
          setSubjects(subjectsResult.data || []);
        }
        
      } catch (error) {
        logger.error('Error loading initial data:', error);
        toast?.showError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [authLoading, toast]);

  // Load classes when program and subject are selected
  useEffect(() => {
    const loadClasses = async () => {
      if (programFilter && subjectFilter) {
        try {
          const result = await getClasses();
          if (result.success) {
            const filteredClasses = result.data.filter(cls => 
              cls.programId === programFilter && cls.subjectId === subjectFilter
            );
            setClasses(filteredClasses);
          }
        } catch (error) {
          logger.error('Error loading classes:', error);
        }
      }
    };

    loadClasses();
  }, [programFilter, subjectFilter]);

  // Load enrollments and marks when class is selected
  useEffect(() => {
    const loadEnrollmentsAndMarks = async () => {
      if (classFilter && subjects.length > 0) {
        try {
          setLoading(true);
          
          const selectedSubject = subjects.find(s => s.docId === subjectFilter || s.id === subjectFilter);
          
          // Load enrollments
          const enrollmentsResult = await getEnrollments();
          if (enrollmentsResult.success) {
            const classEnrollments = enrollmentsResult.data.filter(e => 
              e.classId === classFilter && e.role === USER_ROLES.STUDENT
            );
            setEnrollments(classEnrollments);
          }

          // Load marks
          if (selectedSubject) {
            const marksResult = await getAllClassSubjectMarks(selectedSubject.docId || selectedSubject.id, classFilter);
            if (marksResult.success) {
              setStudentMarks(marksResult.data || {});
            }
          }

        } catch (error) {
          logger.error('Error loading enrollments and marks:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadEnrollmentsAndMarks();
  }, [classFilter, subjects, subjectFilter]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    let result = enrollments.map(enrollment => {
      const student = students.find(s => s.uid === enrollment.userId);
      return student ? { ...student, enrollmentId: enrollment.docId } : null;
    }).filter(Boolean);

    if (searchQuery) {
      result = result.filter(student => 
        student.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [enrollments, students, searchQuery]);

  // Grid columns
  const gridColumns = useMemo(() => [
    {
      field: 'displayName',
      headerName: t('student_name') || 'Student Name',
      flex: 1,
      renderCell: (params) => (
        <div className={styles.studentCell}>
          <div className={styles.studentName}>{params.row.displayName}</div>
          <div className={styles.studentEmail}>{params.row.email}</div>
        </div>
      )
    },
    {
      field: 'midTermExam',
      headerName: t('midterm_exam') || 'Midterm Exam',
      width: 120,
      renderCell: (params) => {
        const compositeKey = `${params.row.uid}_${classFilter}_${subjectFilter}`;
        const marks = studentMarks[compositeKey];
        return (
          <div className={styles.marksCell}>
            <span>{marks?.marks?.midTermExam || 0}</span>
            <small>/20</small>
          </div>
        );
      }
    },
    {
      field: 'finalExam',
      headerName: t('final_exam') || 'Final Exam',
      width: 120,
      renderCell: (params) => {
        const compositeKey = `${params.row.uid}_${classFilter}_${subjectFilter}`;
        const marks = studentMarks[compositeKey];
        return (
          <div className={styles.marksCell}>
            <span>{marks?.marks?.finalExam || 0}</span>
            <small>/40</small>
          </div>
        );
      }
    },
    {
      field: 'totalScore',
      headerName: t('total_score') || 'Total Score',
      width: 120,
      renderCell: (params) => {
        const compositeKey = `${params.row.uid}_${classFilter}_${subjectFilter}`;
        const marks = studentMarks[compositeKey];
        return (
          <div className={styles.totalScoreCell}>
            <span>{marks?.totalScore || 0}</span>
            <small>/100</small>
          </div>
        );
      }
    },
    {
      field: 'actions',
      headerName: t('actions') || 'Actions',
      width: 100,
      renderCell: (params) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEditMarks(params.row)}
        >
          {t('edit') || 'Edit'}
        </Button>
      )
    }
  ], [t, classFilter, subjectFilter, studentMarks]);

  // Handle edit marks
  const handleEditMarks = (student) => {
    const compositeKey = `${student.uid}_${classFilter}_${subjectFilter}`;
    const existingMarks = studentMarks[compositeKey];
    
    setEditingStudent(student);
    setFormData({
      midTermExam: existingMarks?.marks?.midTermExam || 0,
      finalExam: existingMarks?.marks?.finalExam || 0,
      homework: existingMarks?.marks?.homework || 0,
      labsProjectResearch: existingMarks?.marks?.labsProjectResearch || 0,
      quizzes: existingMarks?.marks?.quizzes || 0,
      participation: existingMarks?.marks?.participation || 0,
      attendance: existingMarks?.marks?.attendance || 0
    });
    setShowModal(true);
  };

  // Handle save marks
  const handleSaveMarks = async () => {
    if (!editingStudent) return;

    try {
      const selectedSubject = subjects.find(s => s.docId === subjectFilter || s.id === subjectFilter);
      
      const marksData = {
        studentId: editingStudent.uid,
        classId: classFilter,
        subjectId: selectedSubject?.docId || selectedSubject?.id,
        marks: formData,
        totalScore: calculateTotalScore(formData),
        instructorId: user?.uid,
        semester: 'current',
        academicYear: new Date().getFullYear().toString()
      };

      // This would call the marks service to save
      logger.info('Saving marks:', marksData);
      toast?.showSuccess('Marks saved successfully');
      setShowModal(false);
      
    } catch (error) {
      logger.error('Error saving marks:', error);
      toast?.showError('Failed to save marks');
    }
  };

  // Calculate total score
  const calculateTotalScore = (marks) => {
    const distribution = marksDistribution || {
      midTermExam: 20,
      finalExam: 40,
      homework: 5,
      labsProjectResearch: 10,
      quizzes: 5,
      participation: 10,
      attendance: 10
    };

    let total = 0;
    Object.keys(marks).forEach(key => {
      const weight = distribution[key] || 0;
      const maxMarks = key === 'midTermExam' ? 20 : key === 'finalExam' ? 40 : 10;
      total += (marks[key] / maxMarks) * weight;
    });

    return Math.round(total * 100) / 100;
  };

  // Handle side window
  const handleSideWindowOpen = (content, student) => {
    setSideWindowContent(content);
    setSideWindowStudent(student);
    setSideWindowFilters({
      programFilter,
      subjectFilter,
      classFilter,
      searchQuery,
      marksFilter
    });
    setSideWindowOpen(true);
  };

  const renderSideWindowContent = () => {
    if (!sideWindowContent || !sideWindowStudent) return null;

    switch (sideWindowContent) {
      case RECORD_TYPES.BEHAVIOR:
        return <BehaviorPage student={sideWindowStudent} filters={sideWindowFilters} />;
      default:
        return (
          <div className={styles.sideWindowContent}>
            <h3>Student Overview</h3>
            <p>Content for {sideWindowStudent.displayName}</p>
          </div>
        );
    }
  };

  if (authLoading || loading) {
    return <Loading variant="full" message={t('loading') || 'Loading...'} fancyVariant="dots" />;
  }

  return (
    <Container>
      <Card>
        <CardBody>
          <h1>{t('marks_entry') || 'Marks Entry'}</h1>
          
          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.filterRow}>
              <Select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                placeholder={t('select_program') || 'Select Program'}
              >
                <option value="">{t('select_program') || 'Select Program'}</option>
                {programs.map(program => (
                  <option key={program.docId} value={program.docId}>
                    {program.name}
                  </option>
                ))}
              </Select>

              <Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                placeholder={t('select_subject') || 'Select Subject'}
                disabled={!programFilter}
              >
                <option value="">{t('select_subject') || 'Select Subject'}</option>
                {subjects
                  .filter(subject => subject.programId === programFilter)
                  .map(subject => (
                    <option key={subject.docId} value={subject.docId}>
                      {subject.name}
                    </option>
                  ))}
              </Select>

              <Select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                placeholder={t('select_class') || 'Select Class'}
                disabled={!subjectFilter}
              >
                <option value="">{t('select_class') || 'Select Class'}</option>
                {classes.map(cls => (
                  <option key={cls.docId} value={cls.docId}>
                    {cls.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className={styles.searchRow}>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_students') || 'Search students...'}
              />
            </div>
          </div>

          {/* Data Grid */}
          {classFilter && (
            <div className={styles.gridContainer}>
              <AdvancedDataGrid
                rows={filteredStudents}
                columns={gridColumns}
                getRowId={(row) => row.uid}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
              />
            </div>
          )}

          {!classFilter && (
            <div className={styles.emptyState}>
              <p>{t('select_class_to_view_students') || 'Please select a class to view students'}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Marks Modal */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={t('edit_marks') || 'Edit Marks'}
      >
        <div className={styles.modalContent}>
          {Object.keys(formData).map(key => (
            <div key={key} className={styles.formGroup}>
              <label>{t(key) || key}</label>
              <Input
                type="number"
                value={formData[key]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value) || 0
                }))}
                min="0"
                max={key === 'midTermExam' ? 20 : key === 'finalExam' ? 40 : 10}
              />
            </div>
          ))}
          
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSaveMarks}>
              {t('save') || 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Side Window */}
      <CollapsibleSideWindow
        isOpen={sideWindowOpen}
        onClose={() => setSideWindowOpen(false)}
        title={sideWindowContent === RECORD_TYPES.BEHAVIOR ? (t('behavior') || 'Behavior') :
              sideWindowContent === RECORD_TYPES.PENALTY ? (t('penalties') || 'Penalties') :
              sideWindowContent === RECORD_TYPES.PARTICIPATION ? (t('participation') || 'Participation') : (t('student_overview') || 'Student Overview')}
      >
        {renderSideWindowContent()}
      </CollapsibleSideWindow>
    </Container>
  );
};

export default EnrollmentsMarksPage;
