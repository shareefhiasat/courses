import React, { useState, useCallback, memo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { Modal, Button, Select, Checkbox } from '@ui';

/**
 * CustomWorkflowDialog Component
 *
 * Dialog for creating custom workflows with type, title, description, and file attachment
 * Workflows are created as DRAFT and can be submitted later with reviewer assignment
 */
const CustomWorkflowDialog = ({ isOpen, onClose, file, onSubmit }) => {
  const { t } = useLang();
  
  const [workflowType, setWorkflowType] = useState('GENERAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachFile, setAttachFile] = useState(!!file);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const handleTitleChange = useCallback((e) => {
    console.log('[CustomWorkflowDialog] Title change:', e.target.value);
    const value = e.target.value;
    setTitle(value);
    // Restore focus after state update
    setTimeout(() => {
      if (titleInputRef.current && document.activeElement !== titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 0);
  }, []);
  const handleDescriptionChange = useCallback((e) => {
    console.log('[CustomWorkflowDialog] Description change:', e.target.value);
    const value = e.target.value;
    setDescription(value);
    // Restore focus after state update
    setTimeout(() => {
      if (descriptionInputRef.current && document.activeElement !== descriptionInputRef.current) {
        descriptionInputRef.current.focus();
      }
    }, 0);
  }, []);

  const workflowTypes = [
    { value: 'GENERAL', label: { en: 'General Workflow', ar: 'سير عمل عام' } },
    { value: 'ATTENDANCE_DAILY', label: { en: 'Daily Attendance', ar: 'الحضور اليومي' } },
    { value: 'ATTENDANCE_WEEKLY', label: { en: 'Weekly Attendance', ar: 'الحضور الأسبوعي' } }
  ];

  const reviewerRoles = [
    { value: 'hr', label: { en: 'HR', ar: 'الموارد البشرية' } },
    { value: 'admin', label: { en: 'Admin', ar: 'المسؤول' } },
    { value: 'instructor', label: { en: 'Instructor', ar: 'المعلم' } }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!workflowType) {
      newErrors.workflowType = t('workflow.dialog.errors.workflowTypeRequired', 'Workflow type is required');
    }

    if (!title.trim()) {
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
      const workflowData = {
        workflowType,
        title: title.trim(),
        description: description.trim(),
        reviewers: [], // Always empty - will be assigned when submitting
        attachFile,
        file: attachFile ? file : null
      };

      await onSubmit(workflowData);

      // Reset form
      setWorkflowType('GENERAL');
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
    setWorkflowType('GENERAL');
    setTitle('');
    setDescription('');
    setAttachFile(!!file);
    setErrors({});

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t('workflow.dialog.title', 'Create Custom Workflow')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Workflow Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('workflow.dialog.workflowType', 'Workflow Type')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <Select
            value={workflowType}
            onChange={setWorkflowType}
            options={workflowTypes.map(type => ({
              value: type.value,
              label: type.label.en
            }))}
            error={errors.workflowType}
            className="focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.workflowType && (
            <p className="text-red-500 text-sm mt-1">{errors.workflowType}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('workflow.dialog.title', 'Title')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder={t('workflow.dialog.titlePlaceholder', 'Enter workflow title')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('workflow.dialog.description', 'Description')}
          </label>
          <textarea
            ref={descriptionInputRef}
            value={description}
            onChange={handleDescriptionChange}
            placeholder={t('workflow.dialog.descriptionPlaceholder', 'Enter workflow description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* File Attachment */}
        {file && (
          <div>
            <Checkbox
              checked={attachFile}
              onChange={() => setAttachFile(prev => !prev)}
              label={`${t('workflow.dialog.attachFile', 'Attach file')} (${file.name})`}
            />
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
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
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {t('common.submit', 'Submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default memo(CustomWorkflowDialog);
