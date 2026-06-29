import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { scheduleTourStart } from '@utils/tourScheduler';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, UserSelect, AdvancedDataGrid, SimpleLoading, GridQuickFilterChips } from '@ui';
import { ProgramsSelect } from '@ui';
import { ROLE_STRINGS } from '@constants';
import { ACTIVITY_LOG_TYPES, logActivity } from '@services/other/activityLogger';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getAttendanceByStudent } from '@services/business/attendanceService';
import { getPenalties } from '@services/business/penaltyService';
import { getBehaviors } from '@services/business/behaviorService';
import { getParticipations } from '@services/business/participationService';
import { toggleStudentAccess as toggleStudentAccessService } from '@services/business/enrollmentService';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { DeleteModal, useDeleteModal } from '@ui';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';

const EnrollmentsManagementPage = () => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  // ── Guided Tour ───────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `enrollMgmtTourSeen_${lang}`;
  const buildTourSteps = useCallback(() => [
    { target: '[data-tour="enroll-mgmt-form"]',    content: t('tour.enrollments_add'),     disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="enroll-mgmt-filters"]', content: t('tour.enrollments_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="enroll-mgmt-grid"]',    content: t('tour.enrollments_grid'),    disableBeacon: true, placement: 'top' },
  ].filter(s => !!document.querySelector(s.target)), [t]);
  const startTour = useCallback(() => { const steps = buildTourSteps(); if (!steps.length) return; setTourSteps(steps); setRunTour(true); }, [buildTourSteps]);
  useEffect(() => {
    window.addEventListener('app:joyride', startTour);
    window.addEventListener('app:help', startTour);
    return () => { window.removeEventListener('app:joyride', startTour); window.removeEventListener('app:help', startTour); };
  }, [startTour]);
  useEffect(() => scheduleTourStart(tourSeenKey, lang, startTour), [tourSeenKey, lang, startTour]);
  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ─────────────────────────────────────────────────────────────────────────

  // Refs for form fields to avoid re-renders on keystroke
  // Internal state management
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [localPrograms, setLocalPrograms] = useState([]);
  const [localSubjects, setLocalSubjects] = useState([]);
  const [localClasses, setLocalClasses] = useState([]);
  const [enrollmentForm, setEnrollmentForm] = useState({ 
    studentId: '', 
    classId: '', 
    role: ROLE_STRINGS.STUDENT, 
    programId: '', 
    subjectId: ''
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusChipFilter, setStatusChipFilter] = useState('all');

  const { startLoading } = useGlobalLoading();

  // Load all data
  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setDataLoading(true);
    try {
      const [
        enrollmentsResult,
        usersResult,
        activitiesResult
      ] = await Promise.all([
        import('@services/business/enrollmentService').then(m => m.getEnrollments()),
        import('@services/business/userService').then(m => m.getUsers()),
        import('@services/business/activityService').then(m => m.getActivities())
      ]);
      
      if (enrollmentsResult.success) setEnrollments(enrollmentsResult.data || []);
      if (usersResult.success) setUsers(usersResult.data || []);
      if (activitiesResult.success) setActivities(activitiesResult.data || []);
    } catch (err) {
      error('[EnrollmentManagementPage] Error loading data:', err);
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
    } catch (err) {
      error('[EnrollmentManagementPage] Error loading filters:', err);
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
        ? (subject.nameEn || subject.nameAr || subject.name || subject.code || 'N/A')
        : 'N/A';
      const programName = program
        ? (program.nameEn || program.nameAr || program.name || program.code || 'N/A')
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

  // Show all users except current user (since roles aren't set up in DB yet)
  const availableUsers = useMemo(() => {
    console.log('🔍 [DEBUG] All users loaded:', users);
    const filtered = users.filter(u => {
      // Exclude current user
      const isCurrentUser = u.email === user?.email;
      
      console.log('🔍 [DEBUG] User filter check:', {
        user: u.displayName || u.email,
        isCurrentUser
      });
      
      return !isCurrentUser;
    });
    console.log('🔍 [DEBUG] Available users (excluding current):', filtered);
    return filtered;
  }, [users, user]);

  const filteredEnrollmentRows = useMemo(() => {
    console.log('🔍 [DEBUG] filteredEnrollmentRows called:', {
      totalEnrollments: enrollmentRows.length,
      programFilter,
      subjectFilter,
      classFilter,
      localClassesCount: localClasses.length,
      localSubjectsCount: localSubjects.length
    });

    let rows = enrollmentRows;
    console.log('🔍 [DEBUG] Initial rows:', rows.length);

    if (programFilter) {
      console.log('🔍 [DEBUG] Applying program filter:', programFilter);
      const beforeCount = rows.length;
      rows = rows.filter(row => {
        const classItem = localClasses.find(c => (c.docId || c.id) === row.classId);
        const subject = classItem?.subjectId
          ? localSubjects.find(s => (s.docId || s.id) === classItem.subjectId)
          : null;
        const matches = subject?.programId === programFilter;
        
        if (!matches) {
          console.log('🔍 [DEBUG] Row filtered out by program:', {
            rowClassId: row.classId,
            classItem,
            subject,
            subjectProgramId: subject?.programId,
            filterProgramId: programFilter
          });
        }
        
        return matches;
      });
      console.log('🔍 [DEBUG] After program filter:', beforeCount, '->', rows.length);
    }

    if (subjectFilter) {
      console.log('🔍 [DEBUG] Applying subject filter:', subjectFilter);
      const beforeCount = rows.length;
      rows = rows.filter(row => {
        const classItem = localClasses.find(c => (c.docId || c.id) === row.classId);
        const matches = classItem?.subjectId 
          ? classItem.subjectId === subjectFilter
          : row.subjectId === subjectFilter;
        
        if (!matches) {
          console.log('🔍 [DEBUG] Row filtered out by subject:', {
            rowClassId: row.classId,
            classItemSubjectId: classItem?.subjectId,
            rowSubjectId: row.subjectId,
            filterSubjectId: subjectFilter
          });
        }
        
        return matches;
      });
      console.log('🔍 [DEBUG] After subject filter:', beforeCount, '->', rows.length);
    }

    if (classFilter) {
      console.log('🔍 [DEBUG] Applying class filter:', classFilter);
      const beforeCount = rows.length;
      rows = rows.filter(row => {
        const matches = row.classId === classFilter;
        
        if (!matches) {
          console.log('🔍 [DEBUG] Row filtered out by class:', {
            rowClassId: row.classId,
            filterClassId: classFilter
          });
        }
        
        return matches;
      });
      console.log('🔍 [DEBUG] After class filter:', beforeCount, '->', rows.length);
    }

    console.log('🔍 [DEBUG] Final filtered rows:', rows.length);
    return rows;
  }, [enrollmentRows, localClasses, localSubjects, programFilter, subjectFilter, classFilter]);

  const gridEnrollmentRows = useMemo(() => {
    if (statusChipFilter === 'all') return filteredEnrollmentRows;
    return filteredEnrollmentRows.filter((row) => {
      const code = row.status?.code || 'ENROLLED';
      return code === statusChipFilter;
    });
  }, [filteredEnrollmentRows, statusChipFilter]);

  const enrollmentStatusCounts = useMemo(() => {
    const counts = { ENROLLED: 0, SUSPENDED: 0, PENDING: 0, DROPPED: 0, ACTIVE: 0 };
    filteredEnrollmentRows.forEach((row) => {
      const code = row.status?.code || 'ENROLLED';
      if (counts[code] != null) counts[code] += 1;
    });
    return counts;
  }, [filteredEnrollmentRows]);

  const matchUserId = useCallback((left, right) => {
    if (left == null || right == null) return false;
    return String(left) === String(right);
  }, []);

  const findUserById = useCallback((userId) => {
    return users.find((u) => matchUserId(u.docId || u.id, userId));
  }, [users, matchUserId]);

  const getEnrollmentStatusLabel = useCallback((code) => {
    if (!code) return t('status_enrolled');
    return t(`status_${String(code).toLowerCase()}`) || code;
  }, [t]);

  const enrollmentAuditColumns = useAuditGridColumns({
    users,
    includeUpdater: false,
    includeUpdatedAt: false,
    columnOverrides: {
      createdAt: { headerName: t('enrolled_col'), width: 220 },
    },
  });

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

  const handleEnrollmentSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    const studentIdToUse = enrollmentForm.studentId;
    
    if (!studentIdToUse) {
      toast?.showError(t('participation_please_select_student') || 'Please select a student');
      return;
    }

    if (!enrollmentForm.classId) {
      toast?.showError(t('please_select_class') || 'Please select a class');
      return;
    }
    
    // Check if enrollment already exists
    const existingEnrollment = enrollments.find(enrollment =>
      enrollment.userId === studentIdToUse && enrollment.classId === enrollmentForm.classId
    );
    if (existingEnrollment) {
      toast?.showError(t('user_already_enrolled') || 'This user is already enrolled in this class');
      return;
    }
    
    setLoading(true);
    try {
      const { addEnrollment } = await import('@services/business/enrollmentService');
      const result = await addEnrollment({ ...enrollmentForm, studentId: studentIdToUse }, user);
      if (result.success) {
        // Log activity
        try {
          await logActivity(ACTIVITY_LOG_TYPES.ENROLLMENT_CREATED, {
            enrollmentId: result.id,
            userId: studentIdToUse,
            classId: enrollmentForm.classId,
            role: enrollmentForm.role
          });
        } catch (err) {
          warn('[EnrollmentManagementPage] Failed to log activity:', err);
        }
        await loadData();
        setEnrollmentForm({ studentId: '', classId: '', role: ROLE_STRINGS.STUDENT, programId: '', subjectId: '' });
        toast?.showSuccess(t('enrollment_added_successfully') || 'Enrollment added successfully!');
      } else {
        toast?.showError(t('error') + ': ' + result.error);
      }
    } catch (err) {
      error('[EnrollmentManagementPage] Error adding enrollment:', err);
      toast?.showError(t('error') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [enrollments, enrollmentForm, availableUsers, user, setLoading, loadData, setEnrollmentForm, toast, t]);

  return (
    <div className="enrollments-management">
      <Joyride continuous run={runTour && tourSteps.length > 0} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      <form data-tour="enroll-mgmt-form" onSubmit={handleEnrollmentSubmit} className="dashboard-form">
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
          <UserSelect
            users={availableUsers}
            enrollments={enrollments}
            classes={localClasses}
            value={enrollmentForm.studentId}
            onChange={(studentId) => setEnrollmentForm((prev) => ({ ...prev, studentId }))}
            placeholder={t('select_student') || 'Select student'}
            roleFilter={[ROLE_STRINGS.STUDENT]}
            includeAll={false}
            showEnrollments
            searchable
            fullWidth
          />
        </div>
        
        <div className="form-row wide-cols">
          <Select
            searchable
            placeholder={t('role') || 'Role'}
            value={enrollmentForm.role}
            onChange={e => setEnrollmentForm({ ...enrollmentForm, role: e.target.value })}
            options={[
              { value: ROLE_STRINGS.STUDENT, label: t('student') }
            ]}
          />
        </div>
        
        <div className="form-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button type="submit" variant="primary" disabled={loading} size="medium">
            {t('save') || 'Save'}
          </Button>
          
        </div>
      </form>

      {/* Filters */}
      <div data-tour="enroll-mgmt-filters" style={{ marginTop: '1rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
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
        </div>
      </div>

      {/* Summary Chips — quick filters + stats */}
      <GridQuickFilterChips
        activeId={statusChipFilter}
        onChange={setStatusChipFilter}
        chips={[
          {
            id: 'all',
            label: t('total_enrollments') || 'Total enrollments',
            count: enrollmentSummary.total,
            icon: getThemedIcon('ui', 'layers', 16, theme),
            variant: 'blue',
          },
          {
            id: 'ENROLLED',
            label: getEnrollmentStatusLabel('ENROLLED'),
            count: enrollmentStatusCounts.ENROLLED,
            icon: getThemedIcon('ui', 'check_circle', 16, theme),
            variant: 'green',
          },
          {
            id: 'ACTIVE',
            label: getEnrollmentStatusLabel('ACTIVE'),
            count: enrollmentStatusCounts.ACTIVE,
            icon: getThemedIcon('ui', 'user_check', 16, theme),
            variant: 'green',
          },
          {
            id: 'PENDING',
            label: getEnrollmentStatusLabel('PENDING'),
            count: enrollmentStatusCounts.PENDING,
            icon: getThemedIcon('ui', 'clock', 16, theme),
            variant: 'amber',
          },
          {
            id: 'SUSPENDED',
            label: getEnrollmentStatusLabel('SUSPENDED'),
            count: enrollmentStatusCounts.SUSPENDED,
            icon: getThemedIcon('ui', 'pause_circle', 16, theme),
            variant: 'red',
          },
          {
            id: 'DROPPED',
            label: getEnrollmentStatusLabel('DROPPED'),
            count: enrollmentStatusCounts.DROPPED,
            icon: getThemedIcon('ui', 'user_x', 16, theme),
            variant: 'gray',
          },
          {
            id: 'stat-students',
            label: t('unique_students') || 'Unique students',
            count: enrollmentSummary.uniqueStudents,
            icon: getThemedIcon('ui', 'user', 16, theme),
            variant: 'green',
            filterable: false,
          },
          {
            id: 'stat-classes',
            label: t('unique_classes') || 'Unique classes',
            count: enrollmentSummary.uniqueClasses,
            icon: getThemedIcon('ui', 'home', 16, theme),
            variant: 'amber',
            filterable: false,
          },
          ...(enrollmentSummary.uniquePrograms > 0 ? [{
            id: 'stat-programs',
            label: t('unique_programs') || 'Unique programs',
            count: enrollmentSummary.uniquePrograms,
            icon: getThemedIcon('ui', 'grid', 16, theme),
            variant: 'violet',
            filterable: false,
          }] : []),
        ]}
      />

      <div data-tour="enroll-mgmt-grid" style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          gridId="manage-enrollments"
          rows={gridEnrollmentRows}
          getRowId={(row) => row.docId || row.id}
          lang={lang}
          columns={[
          {
            field: 'userId', 
            headerName: t('student') || 'Student', 
            flex: 1.5, 
            minWidth: 200,
            valueGetter: (params) => {
              const user = findUserById(params.row?.userId);
              if (!user) return params.row?.userId || '';
              return `${getLocalizedUserName(user, lang)} ${user.email || ''}`.trim();
            },
            renderCell: (params) => {
              const user = findUserById(params.value);
              if (!user) return params.value || '—';
              return (
                <div style={{ padding: '8px 0' }}>
                  <div style={{ fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                    {getLocalizedUserName(user, lang)}
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
          ...enrollmentAuditColumns,
          {
            field: 'status', 
            headerName: t('status') || 'STATUS', 
            width: 120,
            valueGetter: (params) => {
              const statusCode = params.row?.status?.code || 'ENROLLED';
              return getEnrollmentStatusLabel(statusCode);
            },
            renderCell: (params) => {
              const status = params.row.status;
              const statusCode = status?.code || 'ENROLLED';
              const statusColors = {
                'ENROLLED': { bg: theme === 'dark' ? '#059669' : '#d1fae5', color: theme === 'dark' ? '#6ee7b7' : '#059669' },
                'SUSPENDED': { bg: theme === 'dark' ? '#dc2626' : '#fee2e2', color: theme === 'dark' ? '#f87171' : '#dc2626' },
                'PENDING': { bg: theme === 'dark' ? '#d97706' : '#fef3c7', color: theme === 'dark' ? '#fbbf24' : '#d97706' },
                'ACTIVE': { bg: theme === 'dark' ? '#059669' : '#d1fae5', color: theme === 'dark' ? '#6ee7b7' : '#059669' },
                'DROPPED': { bg: theme === 'dark' ? '#6b7280' : '#f3f4f6', color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
              };
              const colors = statusColors[statusCode] || statusColors['ENROLLED'];

              return (
                <span style={{ 
                  padding: '4px 8px',
                  backgroundColor: colors.bg,
                  color: colors.color,
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {getEnrollmentStatusLabel(statusCode)}
                </span>
              );
            }
          },
          {
            field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
            renderCell: (params) => {
              const enrollment = params.row;
              const user = findUserById(enrollment.userId);
              const classItem = localClasses.find(c => matchUserId(c.docId || c.id, enrollment.classId));
              const userName = user ? getLocalizedUserName(user, lang) : (t('unknown_user') || 'Unknown User');
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
                  error('[EnrollmentManagementPage] Failed to toggle student access:', error);
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
                  const [attendanceData, penaltiesData, behaviorsData, participationsData] = await Promise.allSettled([
                    getAttendanceByStudent(enrollment.userId).catch(err => {
                      console.warn('Attendance API not available:', err.message);
                      return { success: false, data: [] };
                    }),
                    getPenalties(enrollment.userId).catch(err => {
                      console.warn('Penalties API error:', err.message);
                      return { success: false, data: [] };
                    }),
                    getBehaviors().catch(err => {
                      console.warn('Behaviors API error:', err.message);
                      return { success: false, data: [] };
                    }),
                    getParticipations().catch(err => {
                      console.warn('Participations API error:', err.message);
                      return { success: false, data: [] };
                    })
                  ]);

                  // Extract data from settled promises
                  const attendance = attendanceData.status === 'fulfilled' ? attendanceData.value : { success: false, data: [] };
                  const penalties = penaltiesData.status === 'fulfilled' ? penaltiesData.value : { success: false, data: [] };
                  const behaviors = behaviorsData.status === 'fulfilled' ? behaviorsData.value : { success: false, data: [] };
                  const participations = participationsData.status === 'fulfilled' ? participationsData.value : { success: false, data: [] };

                  if (attendance?.success && Array.isArray(attendance.data)) {
                    attendanceTotal = attendance.data.filter(r => r.classId === enrollment.classId).length;
                  }
                  if (penalties?.success && Array.isArray(penalties.data)) {
                    // Penalties may not always store classId, but when they do, prefer matching by class
                    const penaltiesForClass = penalties.data.filter(p => !p.classId || p.classId === enrollment.classId);
                    penaltiesTotal = penaltiesForClass.length;
                  }
                  if (behaviors?.success && Array.isArray(behaviors.data)) {
                    behaviorsTotal = behaviors.data.filter(
                      b => b.studentId === enrollment.userId && b.classId === enrollment.classId
                    ).length;
                  }
                  if (participations?.success && Array.isArray(participations.data)) {
                    participationsTotal = participations.data.filter(
                      p => p.studentId === enrollment.userId && p.classId === enrollment.classId
                    ).length;
                  }
                } catch (error) {
                  error('[EnrollmentManagementPage] Error loading related records for delete:', error);
                }

                deleteEntity(
                  'enrollment',
                  enrollmentForModal,
                  async () => {
                    try {
                      const { deleteEnrollment } = await import('@services/business/enrollmentService');
                      const result = await deleteEnrollment(enrollment.id || enrollment.docId);
                      if (result.success) {
                        // Log activity
                        try {
                          await logActivity(ACTIVITY_LOG_TYPES.ENROLLMENT_DELETED, {
                            enrollmentId: enrollment.id || enrollment.docId,
                            userId: enrollment.userId,
                            classId: enrollment.classId
                          });
                        } catch (error) {
                          warn('[EnrollmentManagementPage] Failed to log activity:', error);
                        }
                        await loadData();
                        toast?.showSuccess(t('enrollment_removed_successfully') || 'Enrollment removed successfully!');
                      } else {
                        throw new Error(result.error);
                      }
                    } catch (error) {
                      error('[EnrollmentManagementPage] Error deleting enrollment:', error);
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
          pageSize={50}
          pageSizeOptions={[10, 25, 50, 100]}
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
