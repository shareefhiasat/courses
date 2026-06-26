import React, { useState, memo, useRef, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { Modal, Button, Select, Checkbox } from '@ui';
import { WORKFLOW_TYPE_OPTIONS, WORKFLOW_TYPE_BY_VALUE } from '@constants/workflowTypeConfig';
import WorkflowTypeFlowPreview from './WorkflowTypeFlowPreview';
import styles from './CustomWorkflowDialog.module.css';

/**
 * CustomWorkflowDialog Component
 *
 * Dialog for creating custom workflows with type, title, description, and file attachment
 * Workflows are created as DRAFT and can be submitted later with reviewer assignment
 */
const CustomWorkflowDialog = ({ isOpen, onClose, file, onSubmit }) => {
  const { t } = useLang();

  const [workflowType, setWorkflowType] = useState('GENERAL_HR');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachFile, setAttachFile] = useState(!!file);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const workflowTypeOptions = useMemo(
    () =>
      WORKFLOW_TYPE_OPTIONS.map((type) => {
        const label = t(type.labelKey, type.value);
        const subtext = t(type.descKey, '');
        return {
          value: type.value,
          label,
          displayLabel: label,
          subtext,
          searchText: `${label} ${subtext}`.toLowerCase(),
          icon: <WorkflowTypeFlowPreview steps={type.steps} size={14} showApproved={false} />,
        };
      }),
    [t]
  );

  const selectedWorkflowConfig = WORKFLOW_TYPE_BY_VALUE[workflowType];

  const validateForm = () => {
    const newErrors = {};

    if (!workflowType) {
      newErrors.workflowType = t('workflow.dialog.errors.workflowTypeRequired', 'Workflow type is required');
    }

    const titleValue = titleInputRef.current?.value || '';
    if (!titleValue.trim()) {
      newErrors.title = t('workflow.dialog.errors.titleRequired', 'Title is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const titleValue = titleInputRef.current?.value || '';
      const descriptionValue = descriptionInputRef.current?.value || '';
      
      const workflowData = {
        workflowType,
        title: titleValue.trim(),
        description: descriptionValue.trim(),
        reviewers: [], // Always empty - will be assigned when submitting
        attachFile,
        file: attachFile ? file : null
      };

      await onSubmit(workflowData);

      // Reset form
      setWorkflowType('GENERAL_HR');
      setTitle('');
      setDescription('');
      setAttachFile(!!file);
      setErrors({});
      
      onClose();
    } catch (err) {
      console.error('Error creating workflow:', err);
      setErrors({ submit: t('workflow.dialog.errors.submitFailed', 'Failed to create workflow') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setWorkflowType('GENERAL_HR');
    setTitle('');
    setDescription('');
    setAttachFile(!!file);
    setErrors({});

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      size="sm"
      onClose={handleCancel}
      title={t('workflow.dialog.title', 'Create Custom Workflow')}
      footer={
        <div className={styles.footerActions}>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            variant="outline"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            form="custom-workflow-form"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {t('common.submit', 'Submit')}
          </Button>
        </div>
      }
    >
      <form id="custom-workflow-form" onSubmit={handleSubmit} className={styles.form}>
        {/* Workflow Type */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="workflow-type-select">
            {t('workflow.dialog.workflowType', 'Workflow Type')}
            <span className={styles.required}>*</span>
          </label>
          <Select
            id="workflow-type-select"
            value={workflowType}
            onChange={(e) => setWorkflowType(e.value || e.target.value)}
            options={workflowTypeOptions}
            error={errors.workflowType}
            searchable={false}
          />
          {errors.workflowType && (
            <p className={styles.errorText}>{errors.workflowType}</p>
          )}
        </div>

        {selectedWorkflowConfig && (
          <div className={styles.flowPreview} data-testid="workflow-type-flow-preview">
            <p className={styles.flowPreviewTitle}>
              {t('workflow.dialog.flowPreview', 'Approval path')}
            </p>
            <div className={styles.flowPreviewPath}>
              <WorkflowTypeFlowPreview
                steps={selectedWorkflowConfig.steps}
                size={20}
                showLabels
              />
            </div>
            <p className={styles.flowPreviewDesc}>
              {t(selectedWorkflowConfig.descKey, '')}
            </p>
          </div>
        )}

        {/* Title */}
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
          {errors.title && (
            <p className={styles.errorText}>{errors.title}</p>
          )}
        </div>

        {/* Description */}
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

        {/* File Attachment */}
        {file && (
          <div className={styles.field}>
            <Checkbox
              checked={attachFile}
              onChange={() => setAttachFile(prev => !prev)}
              label={`${t('workflow.dialog.attachFile', 'Attach file')} (${file.name})`}
            />
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className={styles.submitError}>
            {errors.submit}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default memo(CustomWorkflowDialog);
