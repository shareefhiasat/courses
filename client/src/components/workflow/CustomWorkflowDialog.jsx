import React, { useState, memo, useRef, useMemo, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { Modal, Button, Select, Checkbox, DatePicker, ClassSelector } from '@ui';
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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const resolvedClassId = useMemo(() => {
    if (!classFilter || classFilter === 'all') return null;
    const cls = classes.find((c) => String(c.id || c.docId) === String(classFilter));
    return cls ? Number(cls.id || cls.docId) : Number(classFilter);
  }, [classFilter, classes]);

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
    setErrors({});
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
        metadata: workflowCategory === 'ATTENDANCE'
          ? {
              ...(attendanceSubtype === 'EXCUSE' ? { excuseType: 'with_excuse' } : {}),
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
          : undefined,
      });

      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating workflow:', err);
      setErrors({ submit: t('workflow.dialog.errors.submitFailed', 'Failed to create workflow') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      size="wide"
      onClose={() => { resetForm(); onClose(); }}
      title={t('workflow.dialog.title', 'Create Custom Workflow')}
      footer={
        <div className={styles.footerActions}>
          <Button type="button" onClick={() => { resetForm(); onClose(); }} disabled={isSubmitting} variant="outline">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" form="custom-workflow-form" disabled={isSubmitting} loading={isSubmitting}>
            {t('common.submit', 'Submit')}
          </Button>
        </div>
      }
    >
      <form id="custom-workflow-form" onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
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
          <div className={styles.field}>
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

        {showApprovalFlowSelect && (
          <div className={styles.field}>
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

        {selectedFlowConfig && (
          <div className={styles.flowPreview} data-testid="workflow-type-flow-preview">
            <p className={styles.flowPreviewTitle}>{t('workflow.dialog.flowPreview', 'Approval path')}</p>
            <div className={styles.flowPreviewPath}>
              <WorkflowTypeFlowPreview steps={selectedFlowConfig.steps} size={20} showLabels />
            </div>
            <p className={styles.flowPreviewDesc}>{t(selectedFlowConfig.descKey, '')}</p>
          </div>
        )}

        {requiresClassContext && (
          <div className={`${styles.field} ${styles.classContextField}`}>
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

        {requiresSingleDate && (
          <div className={styles.field}>
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

        {requiresDates && !requiresSingleDate && (
          <div className={styles.field}>
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

        {requiresAttendance && (
          <div className={styles.field}>
            <label className={styles.label}>
              {t('workflow.dialog.linkedAttendance', 'Linked attendance records')}
              <span className={styles.required}>*</span>
            </label>
            <AttendancePicker
              classId={resolvedClassId}
              dateFrom={dateFrom}
              dateTo={dateTo}
              value={attendanceIds}
              onChange={setAttendanceIds}
            />
            {errors.attendanceIds && <p className={styles.errorText}>{errors.attendanceIds}</p>}
          </div>
        )}

        <div className={styles.field}>
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="workflow-description">
            {t('workflow.dialog.description', 'Description')}
          </label>
          <textarea
            id="workflow-description"
            ref={descriptionInputRef}
            defaultValue={description}
            placeholder={t('workflow.dialog.descriptionPlaceholder', 'Enter workflow description')}
            rows={3}
            className={styles.textArea}
          />
        </div>

        {file && (
          <div className={styles.field}>
            <Checkbox
              checked={attachFile}
              onChange={() => setAttachFile((prev) => !prev)}
              label={`${t('workflow.dialog.attachFile', 'Attach file')} (${file.name})`}
            />
            {errors.attachFile && <p className={styles.errorText}>{errors.attachFile}</p>}
          </div>
        )}

        {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}
      </form>
    </Modal>
  );
};

export default memo(CustomWorkflowDialog);
