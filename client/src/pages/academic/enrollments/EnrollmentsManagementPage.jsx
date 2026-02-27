import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, UserSelect, AdvancedDataGrid, SimpleLoading } from '@ui';
import { ProgramsSelect } from '@ui';
import { USER_ROLES } from '@constants';
import { ACTIVITY_LOG_TYPES, logActivity } from '@services/other/activityLogger';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getAttendanceByStudent } from '@services/business/attendanceService';
import { getPenalties } from '@services/business/penaltyService';
import { getBehaviors } from '@services/business/behaviorService';
import { getParticipations } from '@services/business/participationService';
import { toggleStudentAccess as toggleStudentAccessService } from '@services/business/enrollmentService';
import logger from '@utils/logger';
import { DeleteModal, useDeleteModal } from '@ui';

const EnrollmentsManagementPage = () => {
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  // Refs for form fields to avoid re-renders on keystroke
  const userSelectRef = useRef(null);

  // Internal state management
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [localPrograms, setLocalPrograms] = useState([]);
  const [localSubjects, setLocalSubjects] = useState([]);
  const [localClasses, setLocalClasses] = useState([]);
  const [enrollmentForm, setEnrollmentForm] = useState({ 
    userId: '', 
    classId: '', 
    role: USER_ROLES.STUDENT, 
    programId: '', 
    subjectId: '', 
    year: '', 
    term: '' 
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');

  const { startLoading } = useGlobalLoading();

  // Load all data
  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setDataLoading(true);
    try {
      const [
        enrollmentsResult,
        usersResult,
        activitiesResult,
        submissionsResult
      ] = await Promise.all([
        import('@services/business/enrollmentService').then(m => m.getEnrollments()),
        import('@services/business/userService').then(m => m.getUsers()),
        import('@services/business/activityService').then(m => m.getActivities()),
        import('@services/business/submissionService').then(m => m.getSubmissions())
      ]);
      
      if (enrollmentsResult.success) setEnrollments(enrollmentsResult.data || []);
      if (usersResult.success) setUsers(usersResult.data || []);
      if (activitiesResult.success) setActivities(activitiesResult.data || []);
      if (submissionsResult.success) setSubmissions(submissionsResult.data || []);
    } catch (error) {
      logger.error('[EnrollmentManagementPage] Error loading data:', error);
      toast?.showError(t('failed_to_load_data') || 'Failed to load data');
    } finally {
      if (!isInitial) setDataLoading(false);
    }
  }, [t, toast]);

  // Load programs, subjects, and classes (NotificationDrawer pattern)
  const loadFilters = useCallback(async () => {
    try {
      const [programsRes, subjectsRes, classesRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses()
      ]);
      if (programsRes.success) setLocalPrograms(programsRes.data || []);
      if (subjectsRes.success) setLocalSubjects(subjectsRes.data || []);
      if (classesRes.success) setLocalClasses(classesRes.data || []);
    } catch (error) {
      logger.error('[EnrollmentManagementPage] Error loading filters:', error);
      toast?.showError(t('failed_to_load_filters') || 'Failed to load filters');
    }
  }, [t, toast]);

  // Initial load with Global Loading
  useLayoutEffect(() => {
    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_enrollments') || 'Loading enrollments...' });
      await Promise.all([loadFilters(), loadData(true)]);
      if (stopLoading) stopLoading();
      setDataLoading(false);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoized handler functions for dropdown changes
  const handleEnrollmentProgramChange = useCallback((programId) => {
    setEnrollmentForm(prev => ({ 
      ...prev, 
      programId, 
      subjectId: '', 
      classId: '' 
    }));
  }, [setEnrollmentForm]);

  const handleEnrollmentSubjectChange = useCallback((subjectId) => {
    setEnrollmentForm(prev => ({ 
      ...prev, 
      subjectId, 
      classId: '' 
    }));
  }, [setEnrollmentForm]);

  const handleEnrollmentSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Check if enrollment already exists
    const existingEnrollment = enrollments.find(enrollment =>
      enrollment.userId === enrollmentForm.userId && enrollment.classId === enrollmentForm.classId
    );
    if (existingEnrollment) {
      toast?.showError(t('user_already_enrolled') || 'This user is already enrolled in this class');
      return;
    }
    
    setLoading(true);
    try {
      const { addEnrollment } = await import('@services/business/enrollmentService');
      const result = await addEnrollment(enrollmentForm, user);
      if (result.success) {
        // Log activity
        try {
          await logActivity(ACTIVITY_LOG_TYPES.ENROLLMENT_CREATED, {
            enrollmentId: result.id,
            userId: enrollmentForm.userId,
            classId: enrollmentForm.classId,
            role: enrollmentForm.role
          });
        } catch (error) {
          logger.warn('[EnrollmentManagementPage] Failed to log activity:', error);
        }
        await loadData();
        setEnrollmentForm({ userId: '', classId: '', role: USER_ROLES.STUDENT, programId: '', subjectId: '', year: '', term: '' });
        toast?.showSuccess(t('enrollment_added_successfully') || 'Enrollment added successfully!');
      } else {
        toast?.showError(t('error') + ': ' + result.error);
      }
    } catch (error) {
      logger.error('[EnrollmentManagementPage] Error adding enrollment:', error);
      toast?.showError(t('error') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [enrollments, enrollmentForm, setLoading, loadData, setEnrollmentForm, toast, t]);

  const enrollmentRows = useMemo(() => {
    return (enrollments || []).map((row) => {
      const classItem = localClasses.find(c => (c.docId || c.id) === row.classId);
      const subject = classItem?.subjectId
        ? localSubjects.find(s => (s.docId || s.id) === classItem.subjectId)
        : null;
      const program = subject?.programId
        ? localPrograms.find(p => (p.docId || p.id) === subject.programId)
        : null;

      const subjectName = subject
        ? (subject.name_en || subject.name_ar || subject.name || subject.code || 'N/A')
        : 'N/A';
      const programName = program
        ? (program.name_en || program.name_ar || program.name || program.code || 'N/A')
        : 'N/A';
      const className = classItem
        ? `${classItem.name || classItem.code || 'N/A'}${classItem.code ? ` (${classItem.code})` : ''}`
        : 'N/A';

      return {
        ...row,
        programNameDisplay: programName,
        subjectNameDisplay: subjectName,
        classNameDisplay: className
      };
    });
  }, [enrollments, localClasses, localSubjects, localPrograms]);

  // Only students should appear in the user dropdown (defensive in case role is missing)
  const studentUsers = useMemo(() => {
    return users.filter(u => {
      const role = (u.role || '').toLowerCase();
      return role === (USER_ROLES.STUDENT || 'student');
    });
  }, [users]);

  const filteredEnrollmentRows = useMemo(() => {
    let rows = enrollmentRows;

    if (programFilter) {
      rows = rows.filter(row => {
        const classItem = localClasses.find(c => (c.docId || c.id) === row.classId);
        const subject = classItem?.subjectId
          ? localSubjects.find(s => (s.docId || s.id) === classItem.subjectId)
          : null;
        return subject?.programId === programFilter;
      });
    }

    if (subjectFilter) {
      rows = rows.filter(row => {
        const classItem = localClasses.find(c => (c.docId || c.id) === row.classId);
        if (classItem?.subjectId) return classItem.subjectId === subjectFilter;
        return row.subjectId === subjectFilter;
      });
    }

    if (classFilter) {
      rows = rows.filter(row => row.classId === classFilter);
    }

    if (studentFilter) {
      rows = rows.filter(row => row.userId === studentFilter);
    }

    return rows;
  }, [enrollmentRows, localClasses, localSubjects, programFilter, subjectFilter, classFilter, studentFilter]);

  const enrollmentSummary = useMemo(() => {
    const total = filteredEnrollmentRows.length;
    const uniqueStudents = new Set(filteredEnrollmentRows.map(r => r.userId)).size;
    const uniqueClasses = new Set(filteredEnrollmentRows.map(r => r.classId)).size;

    const programIds = new Set();
    filteredEnrollmentRows.forEach(row => {
      const classItem = localClasses.find(c => (c.docId || c.id) === row.classId);
      const subject = classItem?.subjectId
        ? localSubjects.find(s => (s.docId || s.id) === classItem.subjectId)
        : null;
      if (subject?.programId) {
        programIds.add(subject.programId);
      }
    });

    return {
      total,
      uniqueStudents,
      uniqueClasses,
      uniquePrograms: programIds.size
    };
  }, [filteredEnrollmentRows, localClasses, localSubjects]);

  return (
    <div className="enrollments-section" style={{ marginTop: '2rem' }}>
      <form onSubmit={handleEnrollmentSubmit} className="dashboard-form">
        <div className="form-row wide-cols">
          <UserSelect
            ref={userSelectRef}
            users={studentUsers}
            enrollments={enrollments}
            value={enrollmentForm.userId}
            onChange={e => setEnrollmentForm({ ...enrollmentForm, userId: e.target.value })}
            placeholder={t('select_user') || 'Select User'}
            roleFilter={[USER_ROLES.STUDENT]}
            showEnrollments={true}
            showStatus={true}
            searchable={true}
            required
          />
        </div>
        
        <div className="form-row wide-cols">
          <ProgramsSelect
            programs={localPrograms}
            subjects={localSubjects}
            classes={localClasses}
            selectedProgram={enrollmentForm.programId}
            selectedSubject={enrollmentForm.subjectId}
            selectedClass={enrollmentForm.classId}
            onProgramChange={handleEnrollmentProgramChange}
            onSubjectChange={handleEnrollmentSubjectChange}
            onClassChange={(classId) => setEnrollmentForm(prev => ({ ...prev, classId }))}
            showLabels={false}
            required
          />
        </div>
        
        <div className="form-row wide-cols">
          <Select
            searchable
            placeholder={t('role') || 'Role'}
            value={enrollmentForm.role}
            onChange={e => setEnrollmentForm({ ...enrollmentForm, role: e.target.value })}
            options={[
              { value: USER_ROLES.STUDENT, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a' }}>
                    {getThemedIcon('ui', 'user', 16, theme)}
                  </span>
                  {t('student') || 'Student'}
                </span>
              )}
            ]}
          />
        </div>
        
        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={loading} size="medium">
            {t('save') || 'Save'}
          </Button>
        </div>
      </form>

      {/* Filters */}
      <div style={{ marginTop: '1rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
          <ProgramsSelect
            programs={localPrograms}
            subjects={localSubjects}
            classes={localClasses}
            selectedProgram={programFilter}
            selectedSubject={subjectFilter}
            selectedClass={classFilter}
            onProgramChange={setProgramFilter}
            onSubjectChange={setSubjectFilter}
            onClassChange={setClassFilter}
            showLabels={false}
            className="flex-1"
          />
          <div style={{ minWidth: '220px' }}>
            <Select
              searchable
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              options={[
                { value: '', label: t('all_students') || 'All Students' },
                ...studentUsers.map(u => ({
                  value: u.docId || u.id,
                  label: u.displayName || u.realName || u.email || (t('unknown') || 'Unknown')
                }))
              ]}
              showLabels={false}
              placeholder={t('filter_by_student') || 'Filter by student'}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1d4ed8'
        }}>
          {getThemedIcon('ui', 'layers', 16, theme)}
          {(t('total_enrollments') || 'Total enrollments')}: {enrollmentSummary.total}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: '#ecfdf3',
          border: '1px solid #bbf7d0',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#15803d'
        }}>
          {getThemedIcon('ui', 'user', 16, theme)}
          {(t('unique_students') || 'Unique students')}: {enrollmentSummary.uniqueStudents}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: '#fefce8',
          border: '1px solid #fef9c3',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#854d0e'
        }}>
          {getThemedIcon('ui', 'home', 16, theme)}
          {(t('unique_classes') || 'Unique classes')}: {enrollmentSummary.uniqueClasses}
        </div>
        {enrollmentSummary.uniquePrograms > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: '#f5f3ff',
            border: '1px solid #ddd6fe',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6d28d9'
          }}>
            {getThemedIcon('ui', 'grid', 16, theme)}
            {(t('unique_programs') || 'Unique programs')}: {enrollmentSummary.uniquePrograms}
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={filteredEnrollmentRows}
          getRowId={(row) => row.docId || row.id}
          columns={[
          {
            field: 'userId', 
            headerName: t('student') || 'Student', 
            flex: 1.5, 
            minWidth: 200,
            renderCell: (params) => {
              const user = users.find(u => (u.docId || u.id) === params.value);
              if (!user) return params.value;
              return (
                <div style={{ padding: '8px 0' }}>
                  <div style={{ fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                    {user.displayName || user.realName || '—'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '2px' }}>
                    {user.email || '—'}
                  </div>
                </div>
              );
            }
          },
          {
            field: 'programNameDisplay',
            headerName: t('program') || 'Program',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
              <div style={{ padding: '8px 0', fontWeight: '400' }}>
                {params.value || '—'}
              </div>
            )
          },
          {
            field: 'subjectNameDisplay',
            headerName: t('subject') || 'Subject',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
              <div style={{ padding: '8px 0', fontWeight: '400' }}>
                {params.value || '—'}
              </div>
            )
          },
          {
            field: 'classNameDisplay', 
            headerName: t('class') || 'Class', 
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
              <div style={{ padding: '8px 0', fontWeight: '400' }}>
                {params.value || '—'}
              </div>
            )
          },
          {
            field: 'role', 
            headerName: t('role') || 'Role', 
            width: 120,
            renderCell: (params) => {
              const roleMap = {
                [USER_ROLES.STUDENT]: (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px'
                  }}>
                    {getThemedIcon('ui', 'user', 14, theme)}
                    {t('student') || 'Student'}
                  </span>
                ),
                'ta': (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: theme === 'dark' ? '#7c3aed' : '#ede9fe',
                    color: theme === 'dark' ? '#c4b5fd' : '#7c3aed',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    👨‍🏫 {t('ta') || 'TA'}
                  </span>
                ),
                [USER_ROLES.INSTRUCTOR]: (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: theme === 'dark' ? '#059669' : '#d1fae5',
                    color: theme === 'dark' ? '#6ee7b7' : '#059669',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    👩‍🏫 {t('instructor') || 'Instructor'}
                  </span>
                )
              };
              return roleMap[params.value] || (
                <span style={{ 
                  padding: '4px 8px',
                  backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                  color: theme === 'dark' ? '#d1d5db' : '#6b7280',
                  borderRadius: '12px',
                  fontSize: '0.875rem'
                }}>
                  {params.value}
                </span>
              );
            }
          },
          {
            field: 'createdAt', headerName: t('enrolled_col'), width: 220,
            valueGetter: (params) => params.value,
            renderCell: (params) => {
              if (!params.value) return 'Unknown';
              const dateObj = params.value?.toDate
                ? params.value.toDate()
                : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
              const dateStr = dateObj.toLocaleDateString('en-US', {
                month: 'short', day: '2-digit', year: 'numeric'
              });
              const timeStr = dateObj.toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit', second: '2-digit'
              });
              return `${dateStr} at ${timeStr}`;
            }
          },
          {
            field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
            renderCell: (params) => {
              const enrollment = params.row;
              const user = users.find(u => (u.docId || u.id) === enrollment.userId);
              const classItem = localClasses.find(c => (c.docId || c.id) === enrollment.classId);
              const userName = user ? (user.displayName || user.realName || user.email || 'Unknown User') : 'Unknown User';
              const className = classItem ? (classItem.name || classItem.code || 'Unknown Class') : 'Unknown Class';
              const isDisabled = Array.isArray(classItem?.disabledStudents) && classItem.disabledStudents.includes(enrollment.userId);

              const handleToggleAccess = async () => {
                if (!classItem) return;
                try {
                  const result = await toggleStudentAccessService(
                    enrollment.classId,
                    enrollment.userId,
                    isDisabled,
                    {
                      studentEmail: user?.email,
                      studentName: user?.displayName || user?.realName,
                      className,
                      instructorName: undefined,
                      lang: t('lang') || 'en'
                    }
                  );

                  if (result.success) {
                    const action = isDisabled ? 'enabled' : 'disabled';
                    toast?.showSuccess(
                      t(`student_access_${action}_success`) ||
                      `Student access ${action} successfully${result.data?.notificationSent ? ' and notification sent' : ''}`
                    );
                    await Promise.allSettled([loadFilters(), loadData()]);
                  } else {
                    throw new Error(result.error);
                  }
                } catch (error) {
                  logger.error('[EnrollmentManagementPage] Failed to toggle student access:', error);
                  toast?.showError(t('failed_to_update_student_access') || 'Failed to update student access');
                }
              };

              const handleFullDelete = async () => {
                // Submissions are quiz/activity submissions (student work) - scoped to this class
                const userSubmissionsForClass = submissions.filter(
                  s => s.userId === enrollment.userId && s.classId === enrollment.classId
                );
                const submissionsTotal = userSubmissionsForClass.length;
                const activitiesCompleted = new Set(
                  userSubmissionsForClass
                    .map(s => s.activityId)
                    .filter(Boolean)
                ).size;

                // Create readable item name for this specific enrollment
                const itemName = `${userName} → ${className}`;

                const enrollmentForModal = {
                  ...enrollment,
                  displayName: itemName
                };

                // Compute related record counts for this specific enrollment (class)
                let attendanceTotal = 0;
                let penaltiesTotal = 0;
                let behaviorsTotal = 0;
                let participationsTotal = 0;

                try {
                  const [attendanceRes, penaltiesRes, behaviorsRes, participationsRes] = await Promise.all([
                    getAttendanceByStudent(enrollment.userId),
                    getPenalties(enrollment.userId),
                    getBehaviors(),
                    getParticipations()
                  ]);

                  if (attendanceRes?.success && Array.isArray(attendanceRes.data)) {
                    attendanceTotal = attendanceRes.data.filter(r => r.classId === enrollment.classId).length;
                  }
                  if (penaltiesRes?.success && Array.isArray(penaltiesRes.data)) {
                    // Penalties may not always store classId, but when they do, prefer matching by class
                    const penaltiesForClass = penaltiesRes.data.filter(p => !p.classId || p.classId === enrollment.classId);
                    penaltiesTotal = penaltiesForClass.length;
                  }
                  if (behaviorsRes?.success && Array.isArray(behaviorsRes.data)) {
                    behaviorsTotal = behaviorsRes.data.filter(
                      b => b.studentId === enrollment.userId && b.classId === enrollment.classId
                    ).length;
                  }
                  if (participationsRes?.success && Array.isArray(participationsRes.data)) {
                    participationsTotal = participationsRes.data.filter(
                      p => p.studentId === enrollment.userId && p.classId === enrollment.classId
                    ).length;
                  }
                } catch (error) {
                  logger.error('[EnrollmentManagementPage] Error loading related records for delete:', error);
                }

                deleteEntity(
                  'enrollment',
                  enrollmentForModal,
                  async () => {
                    try {
                      const { deleteEnrollment } = await import('@services/business/enrollmentService');
                      const result = await deleteEnrollment(enrollment.docId);
                      if (result.success) {
                        // Log activity
                        try {
                          await logActivity(ACTIVITY_LOG_TYPES.ENROLLMENT_DELETED, {
                            enrollmentId: enrollment.docId,
                            userId: enrollment.userId,
                            classId: enrollment.classId
                          });
                        } catch (error) {
                          logger.warn('[EnrollmentManagementPage] Failed to log activity:', error);
                        }
                        await loadData();
                        toast?.showSuccess(t('enrollment_removed_successfully') || 'Enrollment removed successfully!');
                      } else {
                        throw new Error(result.error);
                      }
                    } catch (error) {
                      logger.error('[EnrollmentManagementPage] Error deleting enrollment:', error);
                      throw error;
                    }
                  },
                  {
                    relatedRecords: {
                      attendance: attendanceTotal,
                      penalties: penaltiesTotal,
                      participations: participationsTotal,
                      behaviors: behaviorsTotal,
                      activities: activitiesCompleted,
                      submissions: submissionsTotal
                    }
                  }
                );
              };

              return (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={isDisabled ? getThemedIcon('ui', 'user_check', 16, theme) : getThemedIcon('ui', 'user_x', 16, theme)}
                    onClick={handleToggleAccess}
                    style={{ border: 'none' }}
                  >
                    {isDisabled ? (t('enable') || 'Enable') : (t('disable') || 'Disable')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="deleteHover" 
                    icon={getThemedIcon('ui', 'trash', 16, theme)} 
                    style={{ color: '#dc2626' }} 
                    onClick={handleFullDelete}
                  >
                    {t('delete') || 'Delete'}
                  </Button>
                </div>
              );
            }
          }
        ]}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          checkboxSelection
          exportFileName="enrollments"
          showExportButton
          exportLabel={t('export') || 'Export'}
        />
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        relatedRecords={deleteModal.relatedRecords}
        loading={loading}
        t={t}
      />
    </div>
  );
};

export default EnrollmentsManagementPage;
