import React, { useState, memo, useRef, useMemo, useEffect, useCallback } from 'react';
import Joyride from 'react-joyride';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { getModalJoyrideProps, modalTourStep } from '@utils/tourConfig';
import { useModalTour } from '@hooks/useModalTour';
import { useTheme } from '@contexts/ThemeContext';
import { getIconWithColor, getIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import { Modal, Button, Select, DatePicker, ClassSelector, Checkbox } from '@ui';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import {
  WORKFLOW_CATEGORY_OPTIONS,
  ATTENDANCE_SUBTYPE_OPTIONS,
  APPROVAL_FLOW_OPTIONS,
  APPROVAL_FLOW_BY_VALUE,
  ATTENDANCE_SUBTYPE_BY_VALUE,
  resolveDefaultApprovalFlow,
} from '@constants/workflowConfig';
import WorkflowTypeFlowPreview from './WorkflowTypeFlowPreview';
import AttendancePicker from './AttendancePicker';
import ClassStudentSelect from './ClassStudentSelect';
import ExcuseStudentPicker from './ExcuseStudentPicker';
import ShareUserSelect from '@ui/ShareUserSelect';
import { apiService } from '@services/api/apiService';
import { formatForDateInput } from '@utils/date-formatter';
import { toAttendanceDateKey } from '@utils/attendanceDateKey';
import styles from './CustomWorkflowDialog.module.css';

const CustomWorkflowDialog = ({ isOpen, onClose, file, onSubmit }) => {
  const { t, lang } = useLang();

  const [workflowCategory, setWorkflowCategory] = useState('GENERAL');
  const [attendanceSubtype, setAttendanceSubtype] = useState('');
  const [approvalFlow, setApprovalFlow] = useState('HR_ONLY');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachFile, setAttachFile] = useState(!!file);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendanceIds, setAttendanceIds] = useState([]);
  const [shareTargetMode, setShareTargetMode] = useState('role');
  const [specificUserIds, setSpecificUserIds] = useState([]);
  const [targetStudentId, setTargetStudentId] = useState(null);
  const [targetStudentIds, setTargetStudentIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState(null);

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const categoryOptions = useMemo(
    () => WORKFLOW_CATEGORY_OPTIONS.map((cat) => ({
      value: cat.value,
      label: t(cat.labelKey, cat.value),
    })),
    [t]
  );

  const subtypeOptions = useMemo(
    () => ATTENDANCE_SUBTYPE_OPTIONS.map((sub) => ({
      value: sub.value,
      label: t(sub.labelKey, sub.value),
    })),
    [t]
  );

  const approvalFlowOptions = useMemo(
    () => APPROVAL_FLOW_OPTIONS.map((flow) => {
      const label = t(flow.labelKey, flow.value);
      const subtext = t(flow.descKey, '');
      return {
        value: flow.value,
        label,
        displayLabel: label,
        subtext,
        searchText: `${label} ${subtext}`.toLowerCase(),
        icon: <WorkflowTypeFlowPreview steps={flow.steps} size={14} showApproved={false} />,
      };
    }),
    [t]
  );

  const selectedSubtype = attendanceSubtype ? ATTENDANCE_SUBTYPE_BY_VALUE[attendanceSubtype] : null;
  const selectedFlowConfig = APPROVAL_FLOW_BY_VALUE[approvalFlow];
  const showApprovalFlowSelect = workflowCategory === 'GENERAL';
  const showSubtypeSelect = workflowCategory === 'ATTENDANCE';
  const requiresDates = selectedSubtype?.requiresDates;
  const requiresSingleDate = selectedSubtype?.requiresSingleDate;
  const requiresClassContext = selectedSubtype?.requiresClassContext;
  const requiresAttendance = selectedSubtype?.requiresAttendance;
  const requiresTargetStudent =
    workflowCategory === 'BEHAVIOR' ||
    workflowCategory === 'PENALTY' ||
    workflowCategory === 'DISCONTINUATION' ||
    (workflowCategory === 'ATTENDANCE' && (attendanceSubtype === 'WARNING' || attendanceSubtype === 'EXCUSE'));

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const { theme } = useTheme();
  const tourSeenKey = `workflowDialogTourSeen_${lang}`;

  const buildTourSteps = useCallback(() => {
    const steps = [
      modalTourStep('[data-tour="workflow-category"]', t('tour.workflow_category')),
    ];

    if (showSubtypeSelect) {
      steps.push(modalTourStep('[data-tour="workflow-subtype"]', t('tour.workflow_subtype')));
    }

    if (showApprovalFlowSelect) {
      steps.push(modalTourStep('[data-tour="workflow-approval-flow"]', t('tour.workflow_approval_flow')));
    }

    steps.push(modalTourStep('[data-tour="workflow-flow-preview"]', t('tour.workflow_flow_preview')));
    steps.push(modalTourStep('[data-tour="workflow-share-target"]', t('tour.workflow_share_target')));

    if (requiresClassContext) {
      steps.push(modalTourStep('[data-tour="workflow-class-context"]', t('tour.workflow_class_context')));
    }

    if (requiresSingleDate || requiresDates) {
      steps.push(modalTourStep('[data-tour="workflow-dates"]', t('tour.workflow_dates')));
    }

    if (requiresAttendance) {
      steps.push(modalTourStep('[data-tour="workflow-attendance"]', t('tour.workflow_attendance')));
    }

    if (requiresTargetStudent) {
      steps.push(modalTourStep('[data-tour="workflow-target-student"]', t('tour.workflow_target_student')));
    }

    steps.push(
      modalTourStep('[data-tour="workflow-title"]', t('tour.workflow_title')),
      modalTourStep('[data-tour="workflow-description"]', t('tour.workflow_description')),
      modalTourStep('[data-tour="workflow-attachment"]', t('tour.workflow_attachment')),
      modalTourStep('[data-tour="workflow-submit"]', t('tour.workflow_submit'), { placement: 'top' }),
    );

    return steps;
  }, [
    t,
    showSubtypeSelect,
    showApprovalFlowSelect,
    requiresClassContext,
    requiresSingleDate,
    requiresDates,
    requiresAttendance,
    requiresTargetStudent,
  ]);

  const {
    run: runTour,
    stepIndex,
    steps: tourSteps,
    startTour,
    callback: handleTourCallback,
    TourTooltipComponent,
    tourActive,
  } = useModalTour({
    id: 'workflow-dialog',
    tourSeenKey,
    buildSteps: buildTourSteps,
    enabled: isOpen,
  });
  // ─────────────────────────────────────────────────────────────────────────

  const resolvedClassId = useMemo(() => {
    if (!classFilter || classFilter === 'all') return null;
    const cls = classes.find((c) => String(c.id || c.docId) === String(classFilter));
    return cls ? Number(cls.id || cls.docId) : Number(classFilter);
  }, [classFilter, classes]);

  const requiresExcuseGuidedFlow = workflowCategory === 'ATTENDANCE' && attendanceSubtype === 'EXCUSE';

  useEffect(() => {
    if (!isOpen || !requiresExcuseGuidedFlow) return;
    if (!resolvedClassId || !targetStudentIds.length || !dateFrom) {
      setAttendanceIds([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const ids = [];
        const targetKey = toAttendanceDateKey(dateFrom);
        await Promise.all(targetStudentIds.map(async (studentId) => {
          const params = new URLSearchParams();
          params.append('classId', String(resolvedClassId));
          params.append('userId', String(studentId));
          params.append('date', dateFrom);
          params.append('limit', '10');
          const response = await apiService.get(`/attendance?${params.toString()}`);
          const rows = response?.data || response?.payload || [];
          const match = rows.find((row) => toAttendanceDateKey(row.date) === targetKey) || rows[0];
          if (match?.id) ids.push(match.id);
        }));
        if (!cancelled) setAttendanceIds(ids);
      } catch (err) {
        console.error('[CustomWorkflowDialog] excuse attendance lookup failed', err);
        if (!cancelled) setAttendanceIds([]);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, requiresExcuseGuidedFlow, resolvedClassId, targetStudentIds, dateFrom]);

  useEffect(() => {
    if (!isOpen || !requiresExcuseGuidedFlow || dateFrom) return;
    setDateFrom(formatForDateInput(new Date()));
  }, [isOpen, requiresExcuseGuidedFlow, dateFrom]);

  useEffect(() => {
    if (!isOpen) return;
    setWorkflowCategory('GENERAL');
    setAttendanceSubtype('');
    setApprovalFlow('HR_ONLY');
    setDateFrom('');
    setDateTo('');
    setProgramFilter('');
    setSubjectFilter('');
    setClassFilter('');
    setAttendanceIds([]);
    setShareTargetMode('role');
    setSpecificUserIds([]);
    setTargetStudentId(null);
    setTargetStudentIds([]);
    setErrors({});
    setExistingWorkflow(null);
    setAttachFile(!!file);
  }, [isOpen, file]);

  useEffect(() => {
    const nextFlow = resolveDefaultApprovalFlow(workflowCategory, attendanceSubtype || null);
    setApprovalFlow(nextFlow);
    if (workflowCategory !== 'ATTENDANCE') {
      setAttendanceSubtype('');
      setAttendanceIds([]);
      setProgramFilter('');
      setSubjectFilter('');
      setClassFilter('');
      setDateFrom('');
      setDateTo('');
      setTargetStudentId(null);
      setTargetStudentIds([]);
    }
  }, [workflowCategory, attendanceSubtype]);

  useEffect(() => {
    if (!isOpen || workflowCategory !== 'ATTENDANCE') return;

    let cancelled = false;
    (async () => {
      try {
        const [programsRes, subjectsRes, classesRes] = await Promise.all([
          getPrograms(),
          getSubjects(),
          getClasses(),
        ]);
        if (cancelled) return;
        if (programsRes.success) setPrograms(programsRes.data || []);
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
        if (classesRes.success) setClasses(classesRes.data || []);
      } catch (err) {
        console.error('[CustomWorkflowDialog] Failed to load class context:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, workflowCategory]);

  const validateForm = () => {
    const newErrors = {};
    const titleValue = titleInputRef.current?.value || '';

    if (!workflowCategory) {
      newErrors.workflowCategory = t('workflow.dialog.errors.categoryRequired', 'Workflow category is required');
    }
    if (workflowCategory === 'ATTENDANCE' && !attendanceSubtype) {
      newErrors.attendanceSubtype = t('workflow.dialog.errors.subtypeRequired', 'Attendance type is required');
    }
    if (!titleValue.trim()) {
      newErrors.title = t('workflow.dialog.errors.titleRequired', 'Title is required');
    }
    if (requiresSingleDate && !dateFrom) {
      newErrors.dateFrom = t('workflow.dialog.errors.dateRequired', 'Attendance date is required');
    }
    if (requiresDates && (!dateFrom || !dateTo)) {
      newErrors.dates = t('workflow.dialog.errors.datesRequired', 'Coverage period is required');
    }
    if (requiresClassContext && !resolvedClassId) {
      newErrors.classContext = t('workflow.dialog.errors.classRequired', 'Program, subject, and class are required');
    }
    if (requiresAttendance && attendanceIds.length === 0) {
      newErrors.attendanceIds = t('workflow.dialog.errors.attendanceRequired', 'Select at least one attendance record');
    }
    if (requiresAttendance && attachFile && !file) {
      newErrors.attachFile = t('workflow.dialog.errors.attachmentRequired', 'Attachment is required for excuse workflows');
    }
    if (shareTargetMode === 'users' && specificUserIds.length === 0) {
      newErrors.specificUserIds = t('workflow.dialog.errors.specificUsersRequired', 'Select at least one user to share with');
    }
    if (requiresExcuseGuidedFlow && targetStudentIds.length === 0) {
      newErrors.targetStudentId = t('workflow.dialog.errors.targetStudentRequired', 'Select a target student');
    } else if (requiresTargetStudent && !requiresExcuseGuidedFlow && !targetStudentId) {
      newErrors.targetStudentId = t('workflow.dialog.errors.targetStudentRequired', 'Select a target student');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setWorkflowCategory('GENERAL');
    setAttendanceSubtype('');
    setApprovalFlow('HR_ONLY');
    setTitle('');
    setDescription('');
    setAttachFile(!!file);
    setDateFrom('');
    setDateTo('');
    setProgramFilter('');
    setSubjectFilter('');
    setClassFilter('');
    setAttendanceIds([]);
    setShareTargetMode('role');
    setSpecificUserIds([]);
    setTargetStudentId(null);
    setTargetStudentIds([]);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const titleValue = titleInputRef.current?.value || '';
      const descriptionValue = descriptionInputRef.current?.value || '';
      const selectedClass = classes.find((c) => Number(c.id || c.docId) === resolvedClassId);
      const selectedProgram = programs.find((p) => (p.docId || p.id) === programFilter);
      const selectedSubject = subjects.find((s) => (s.docId || s.id) === subjectFilter);

      await onSubmit({
        workflowCategory,
        attendanceSubtype: workflowCategory === 'ATTENDANCE' ? attendanceSubtype : null,
        approvalFlow,
        title: titleValue.trim(),
        description: descriptionValue.trim(),
        reviewers: [],
        attachFile,
        file: attachFile ? file : null,
        dateFrom: workflowCategory === 'ATTENDANCE' ? (dateFrom || null) : null,
        dateTo: workflowCategory === 'ATTENDANCE' ? (requiresSingleDate ? (dateFrom || null) : (dateTo || null)) : null,
        classId: workflowCategory === 'ATTENDANCE' ? resolvedClassId : null,
        program: workflowCategory === 'ATTENDANCE' ? (selectedProgram?.code || programFilter || null) : null,
        subject: workflowCategory === 'ATTENDANCE' ? (selectedSubject?.code || subjectFilter || null) : null,
        attendanceIds: workflowCategory === 'ATTENDANCE' ? attendanceIds : [],
        targetStudentId: requiresExcuseGuidedFlow
          ? (targetStudentIds[0] || null)
          : (requiresTargetStudent ? targetStudentId : null),
        targetStudentIds: requiresExcuseGuidedFlow ? targetStudentIds : [],
        specificUserIds: shareTargetMode === 'users' ? specificUserIds : [],
        metadata: workflowCategory === 'ATTENDANCE'
          ? {
              ...(attendanceSubtype === 'EXCUSE' ? { excuseType: 'with_excuse', targetStudentIds } : {}),
              shareTargetMode,
              specificUserIds: shareTargetMode === 'users' ? specificUserIds : [],
              attendanceContext: attendanceSubtype === 'DAILY'
                ? 'class_daily'
                : attendanceSubtype === 'WEEKLY_SUMMARY'
                  ? 'class_weekly'
                  : attendanceSubtype === 'EXCUSE'
                    ? 'excuse'
                    : 'warning',
              className: selectedClass?.name || selectedClass?.title || selectedClass?.code || null,
              programId: programFilter || null,
              subjectId: subjectFilter || null,
            }
          : {
              shareTargetMode,
              specificUserIds: shareTargetMode === 'users' ? specificUserIds : [],
            },
      });

      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating workflow:', err);
      const status = err?.response?.status || err?.code;
      const existingWorkflow = err?.response?.data?.existingWorkflow || err?.existingWorkflow;
      if (status === 409 && existingWorkflow) {
        const wf = existingWorkflow;
        const wfTitle = wf.title || `#${wf.id}`;
        const wfStatus = wf.status || 'in progress';
        setExistingWorkflow(wf);
        setErrors({
          submit: t('workflow.dialog.errors.duplicateWorkflow', 'An in-progress workflow already exists: "{{title}}" ({{status}}). Please approve or reject it before creating a new one.', { title: wfTitle, status: wfStatus }),
        });
      } else {
        setErrors({ submit: t('workflow.dialog.errors.submitFailed', 'Failed to create workflow') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      size="wide"
      tourActive={tourActive}
      draggable={!tourActive}
      onClose={() => { resetForm(); onClose(); }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{t('workflow.dialog.title', 'Create Custom Workflow')}</span>
          <ColoredTooltip title={t('tour.replay')}>
            <button
              data-tour="workflow-help-btn"
              onClick={startTour}
              aria-label={t('tour.replay')}
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid var(--border, #e5e7eb)',
                background: 'var(--background-secondary, #f9fafb)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary, #800020)',
              }}
            >
              {getIconWithColor('ui', 'help', 16, 'currentColor')}
            </button>
          </ColoredTooltip>
        </div>
      }
      footer={
        <div className={styles.footerActions}>
          <Button type="button" onClick={() => { resetForm(); onClose(); }} disabled={isSubmitting} variant="outline">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" form="custom-workflow-form" disabled={isSubmitting} loading={isSubmitting} data-tour="workflow-submit">
            {t('common.submit', 'Submit')}
          </Button>
        </div>
      }
    >
      <form id="custom-workflow-form" onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.categoryRow}>
          <div className={styles.field} data-tour="workflow-category">
            <label className={styles.label} htmlFor="workflow-category-select">
              {t('workflow.dialog.workflowCategory', 'Workflow category')}
              <span className={styles.required}>*</span>
            </label>
            <Select
              id="workflow-category-select"
              value={workflowCategory}
              onChange={(e) => setWorkflowCategory(e.value || e.target.value)}
              options={categoryOptions}
              error={errors.workflowCategory}
            />
          </div>

          {showSubtypeSelect && (
            <div className={styles.field} data-tour="workflow-subtype">
              <label className={styles.label} htmlFor="attendance-subtype-select">
                {t('workflow.dialog.attendanceSubtype', 'Attendance type')}
                <span className={styles.required}>*</span>
              </label>
              <Select
                id="attendance-subtype-select"
                value={attendanceSubtype}
                onChange={(e) => setAttendanceSubtype(e.value || e.target.value)}
                options={subtypeOptions}
                error={errors.attendanceSubtype}
              />
              {selectedSubtype?.contextKey && (
                <p className={styles.helperText}>{t(selectedSubtype.contextKey, '')}</p>
              )}
            </div>
          )}
        </div>

        {showApprovalFlowSelect && (
          <div className={styles.field} data-tour="workflow-approval-flow">
            <label className={styles.label} htmlFor="approval-flow-select">
              {t('workflow.dialog.approvalFlow', 'Approval route')}
            </label>
            <Select
              id="approval-flow-select"
              value={approvalFlow}
              onChange={(e) => setApprovalFlow(e.value || e.target.value)}
              options={approvalFlowOptions}
            />
          </div>
        )}

        {requiresClassContext && (
          <div className={`${styles.field} ${styles.classContextField}`} data-tour="workflow-class-context">
            <label className={styles.label}>
              {t('workflow.dialog.classContext', 'Class context')}
              <span className={styles.required}>*</span>
            </label>
            <ClassSelector
              programs={programs}
              subjects={subjects}
              classes={classes}
              values={{ program: programFilter, subject: subjectFilter, class: classFilter }}
              onChange={{
                setProgram: setProgramFilter,
                setSubject: setSubjectFilter,
                setClass: setClassFilter,
              }}
              showAllOption={false}
              required
              t={t}
              lang={lang}
            />
            {errors.classContext && <p className={styles.errorText}>{errors.classContext}</p>}
          </div>
        )}

        {requiresExcuseGuidedFlow && (
          <div className={styles.dateStudentRow}>
            <div className={styles.field} data-tour="workflow-dates">
              <DatePicker
                label={t('workflow.dialog.attendanceDate', 'Attendance date')}
                value={dateFrom}
                onChange={setDateFrom}
                required
                fullWidth
                error={errors.dateFrom}
              />
            </div>
            <div className={styles.field} data-tour="workflow-target-student">
              <label className={styles.label}>
                {t('workflow.dialog.targetStudents', 'Target students')}
                <span className={styles.required}>*</span>
              </label>
              <ExcuseStudentPicker
                classId={resolvedClassId}
                date={dateFrom}
                value={targetStudentIds}
                onChange={setTargetStudentIds}
              />
              {errors.targetStudentId && <p className={styles.errorText}>{errors.targetStudentId}</p>}
            </div>
          </div>
        )}

        {requiresTargetStudent && !requiresExcuseGuidedFlow && (
          <div className={styles.field} data-tour="workflow-target-student">
            <label className={styles.label}>
              {t('workflow.dialog.targetStudent', 'Target student')}
              <span className={styles.required}>*</span>
            </label>
            <ShareUserSelect
              value={targetStudentId}
              onChange={setTargetStudentId}
              placeholder={t('workflow.dialog.selectTargetStudent', 'Select student')}
              excludeStudents={false}
              fullWidth
            />
            {errors.targetStudentId && <p className={styles.errorText}>{errors.targetStudentId}</p>}
          </div>
        )}

        {requiresExcuseGuidedFlow && (
          <div className={styles.field} data-tour="workflow-attendance">
            <label className={styles.label}>
              {t('workflow.dialog.linkedAttendance', 'Linked attendance records')}
            </label>
            {attendanceIds.length > 0 ? (
              <p className={styles.helperText}>
                {t('workflow.dialog.excuseAttendanceLinkedCount', '{{count}} attendance record(s) linked.', { count: attendanceIds.length })}
              </p>
            ) : (
              <p className={styles.errorText}>
                {resolvedClassId && targetStudentIds.length > 0 && dateFrom
                  ? t('workflow.dialog.excuseAttendanceMissing', 'No attendance record found for this student on the selected date.')
                  : t('workflow.dialog.excuseAttendancePending', 'Select class, date, and student to link attendance.')}
              </p>
            )}
            {errors.attendanceIds && <p className={styles.errorText}>{errors.attendanceIds}</p>}
          </div>
        )}

        <div className={styles.field} data-tour="workflow-share-target">
          <label className={styles.label}>
            {t('workflow.dialog.shareTarget', 'Share with')}
          </label>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                name="shareTargetMode"
                value="role"
                checked={shareTargetMode === 'role'}
                onChange={() => { setShareTargetMode('role'); setSpecificUserIds([]); }}
              />
              {t('workflow.dialog.shareWithRole', 'Role (from approval flow)')}
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                name="shareTargetMode"
                value="users"
                checked={shareTargetMode === 'users'}
                onChange={() => setShareTargetMode('users')}
              />
              {t('workflow.dialog.shareWithUsers', 'Specific users')}
            </label>
          </div>
          {shareTargetMode === 'role' ? (
            <p className={styles.helperText}>
              {t('workflow.dialog.shareWithRoleHelp', 'File will be shared with all users in the approval flow role (e.g. HR or Admin). They will see it in "Shared with me".')}
            </p>
          ) : (
            <>
              <ShareUserSelect
                multiple
                value={specificUserIds}
                onChange={setSpecificUserIds}
                placeholder={t('workflow.dialog.selectUsers', 'Select users to share with')}
                fullWidth
              />
              {errors.specificUserIds && <p className={styles.errorText}>{errors.specificUserIds}</p>}
            </>
          )}
        </div>

        {selectedFlowConfig && (
          <div className={`${styles.flowPreview} ${styles.flowPreviewCompact}`} data-testid="workflow-type-flow-preview" data-tour="workflow-flow-preview">
            <p className={styles.flowPreviewTitle}>{t('workflow.dialog.flowPreview', 'Approval path')}</p>
            <div className={styles.flowPreviewPath}>
              <WorkflowTypeFlowPreview steps={selectedFlowConfig.steps} size={14} showLabels />
            </div>
            <p className={styles.flowPreviewDesc}>{t(selectedFlowConfig.descKey, '')}</p>
          </div>
        )}

        {requiresDates && !requiresSingleDate && (
          <div className={styles.field} data-tour="workflow-dates">
            <label className={styles.label}>
              {t('workflow.dialog.coveragePeriod', 'Coverage period')}
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.dateRow}>
              <DatePicker
                label={t('workflow.dialog.dateFrom', 'From')}
                value={dateFrom}
                onChange={setDateFrom}
                required
                fullWidth
              />
              <DatePicker
                label={t('workflow.dialog.dateTo', 'To')}
                value={dateTo}
                onChange={setDateTo}
                required
                fullWidth
                min={dateFrom || undefined}
              />
            </div>
            {errors.dates && <p className={styles.errorText}>{errors.dates}</p>}
          </div>
        )}

        {requiresAttendance && !requiresExcuseGuidedFlow && (
          <div className={styles.field} data-tour="workflow-attendance">
            <label className={styles.label}>
              {t('workflow.dialog.linkedAttendance', 'Linked attendance records')}
              <span className={styles.required}>*</span>
            </label>
            <AttendancePicker
              classId={resolvedClassId}
              userId={targetStudentId || undefined}
              dateFrom={dateFrom}
              dateTo={requiresSingleDate ? dateFrom : dateTo}
              value={attendanceIds}
              onChange={setAttendanceIds}
            />
            {errors.attendanceIds && <p className={styles.errorText}>{errors.attendanceIds}</p>}
          </div>
        )}

        <div className={styles.titleDescRow}>
          <div className={styles.field} data-tour="workflow-title">
            <label className={styles.label} htmlFor="workflow-title">
              {t('workflow.dialog.titleLabel', 'Title')}
              <span className={styles.required}>*</span>
            </label>
            <input
              id="workflow-title"
              ref={titleInputRef}
              type="text"
              defaultValue={title}
              placeholder={t('workflow.dialog.titlePlaceholder', 'Enter workflow title')}
              className={`${styles.textInput} ${errors.title ? styles.textInputError : ''}`}
            />
            {errors.title && <p className={styles.errorText}>{errors.title}</p>}
          </div>

          <div className={styles.field} data-tour="workflow-description">
            <label className={styles.label} htmlFor="workflow-description">
              {t('workflow.dialog.description', 'Description')}
            </label>
            <input
              id="workflow-description"
              ref={descriptionInputRef}
              type="text"
              defaultValue={description}
              placeholder={t('workflow.dialog.descriptionPlaceholder', 'Enter workflow description')}
              className={styles.textInput}
            />
          </div>
        </div>

        {requiresSingleDate && !requiresExcuseGuidedFlow && (
          <div className={styles.field} data-tour="workflow-dates">
            <DatePicker
              label={t('workflow.dialog.attendanceDate', 'Attendance date')}
              value={dateFrom}
              onChange={setDateFrom}
              required
              fullWidth
              error={errors.dateFrom}
            />
          </div>
        )}

        {file && (
          <div className={styles.field} data-tour="workflow-attachment">
            <Checkbox
              checked={attachFile}
              onChange={() => setAttachFile((prev) => !prev)}
              label={`${t('workflow.dialog.attachFile', 'Attach file')} (${file.name})`}
            />
            {errors.attachFile && <p className={styles.errorText}>{errors.attachFile}</p>}
          </div>
        )}

        <p className={styles.helperText}>
          {t('workflow.dialog.openInNewTabHint', 'After submit, the workflow will open in a new browser tab. This page stays on Smart Drive.')}
        </p>

        {errors.submit && (
          <div className={styles.submitError}>
            {errors.submit}
            {existingWorkflow && (
              <a
                href={`/workflow-documents/${existingWorkflow.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem', color: 'var(--color-primary, #3b82f6)', textDecoration: 'underline', fontWeight: 500 }}
              >
                {t('workflow.dialog.errors.viewExisting', 'View existing workflow')}
                {getIcon('ui', 'external_link', 14, 'currentColor')}
              </a>
            )}
          </div>
        )}
      </form>
    </Modal>
      <Joyride
        {...getModalJoyrideProps({ theme, t })}
        run={runTour}
        stepIndex={stepIndex}
        steps={tourSteps}
        callback={handleTourCallback}
        tooltipComponent={TourTooltipComponent}
      />
    </>
  );
};

export default memo(CustomWorkflowDialog);
