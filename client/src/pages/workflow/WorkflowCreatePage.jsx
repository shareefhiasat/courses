/**
 * Workflow Create Page
 * 
 * PURPOSE: Create new workflow documents for approval
 * ARCHITECTURE: UI Page → Business Service → Backend API
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Send, 
  ArrowLeft
} from 'lucide-react';
import { format } from "date-fns";
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { getThemedIcon } from '@constants/iconTypes';
import { useAuth } from "@contexts/AuthContext";
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNotifications } from "@hooks/useNotifications";
import { createWorkflowDocument, sendWorkflowDocument } from '@services/business/workflowService';
import { getUsers } from '@services/business/userService';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { ROLE_STRINGS } from '@utils/userUtils.js';
import NextcloudFileUpload from '@components/workflow/NextcloudFileUpload';

// UI Components
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Select, SimpleLoading } from '@ui';

const WorkflowCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const { triggerNotification } = useNotifications();

  // Get role data from lookup API
  const { data: lookupData } = useLookupTypes({
    types: ['user-roles']
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentType: '',
    nextcloudFileId: '',
    nextcloudFilePath: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [recipientRoleFilter, setRecipientRoleFilter] = useState('all');
  const [recipientId, setRecipientId] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [sendComment, setSendComment] = useState('');

  // Document type options
  const documentTypeOptions = [
    { value: '', label: t('workflow.create.selectType', 'Select Document Type') },
    { value: 'CURRICULUM', label: t('workflow.types.curriculum', 'Curriculum') },
    { value: 'POLICY', label: t('workflow.types.policy', 'Policy') },
    { value: 'LEAVE_REQUEST', label: t('workflow.types.leaveRequest', 'Leave Request') },
    { value: 'PURCHASE_REQUEST', label: t('workflow.types.purchaseRequest', 'Purchase Request') },
    { value: 'CALENDAR', label: t('workflow.types.calendar', 'Calendar') },
    { value: 'OTHER', label: t('workflow.types.other', 'Other') }
  ];

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const getRoleCodes = useCallback((userItem) => {
    const normalizeRoleToken = (value) => String(value || '')
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .trim();

    const expandRoleAliases = (roleCode) => {
      const normalized = normalizeRoleToken(roleCode);

      if (!normalized) {
        return [];
      }

      const aliases = new Set([normalized]);
      const userRoles = lookupData['user-roles'] || [];

      // Use lookup API data for role mappings
      const findRoleByCode = (code) => userRoles.find(role => 
        role.code?.toLowerCase() === code.toLowerCase()
      );

      // Add aliases based on lookup data
      const superAdminRole = findRoleByCode(ROLE_STRINGS.SUPER_ADMIN);
      const adminRole = findRoleByCode(ROLE_STRINGS.ADMIN);
      const hrRole = findRoleByCode(ROLE_STRINGS.HR);
      const instructorRole = findRoleByCode(ROLE_STRINGS.INSTRUCTOR);

      // Handle common variations and use constants for condition checks
      if (normalized === 'superadmin' && superAdminRole) {
        aliases.add(superAdminRole.code.toLowerCase());
      }
      if (normalized === 'humanresources' && hrRole) {
        aliases.add(hrRole.code.toLowerCase());
      }
      if (normalized === 'teacher' && instructorRole) {
        aliases.add(instructorRole.code.toLowerCase());
      }

      // Use constants for admin group logic
      if (normalized === ROLE_STRINGS.SUPER_ADMIN && superAdminRole) {
        aliases.add('admin_group');
        aliases.add(superAdminRole.code.toLowerCase());
      }
      if (normalized === ROLE_STRINGS.ADMIN && adminRole) {
        aliases.add('admin_group');
        aliases.add(adminRole.code.toLowerCase());
      }
      
      // Handle uppercase role codes from database using lookup data
      if (superAdminRole && normalized === superAdminRole.code.toLowerCase()) {
        aliases.add('superadmin');
      }
      if (adminRole && normalized === adminRole.code.toLowerCase()) {
        aliases.add(ROLE_STRINGS.SUPER_ADMIN);
      }
      if (hrRole && normalized === hrRole.code.toLowerCase()) {
        aliases.add('human_resources');
      }
      if (instructorRole && normalized === instructorRole.code.toLowerCase()) {
        aliases.add('teacher');
      }

      return Array.from(aliases);
    };

    if (!userItem || typeof userItem !== 'object') {
      return [];
    }

    const roleTokens = [
      ...(Array.isArray(userItem.roleAssignments)
        ? userItem.roleAssignments.map((assignment) => assignment?.role?.code)
        : []),
      ...(Array.isArray(userItem.roles) ? userItem.roles : []),
      ...(userItem.primaryRole?.code ? [userItem.primaryRole.code] : []),
      ...(userItem.role ? [userItem.role] : []),
      ...(userItem.userRole ? [userItem.userRole] : [])
    ];

    return Array.from(
      new Set(roleTokens.flatMap(expandRoleAliases).filter(Boolean))
    );

  }, []);

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const result = await getUsers({ max: 500 });
        if (!result?.success || !Array.isArray(result.data)) {
          setRecipients([]);
          return;
        }

        const currentUserEmail = (user?.email || '').toLowerCase();
        const mappedRecipients = result.data
          .filter((u) => (u.email || '').toLowerCase() !== currentUserEmail)
          .map((u) => {
            const roleCodes = getRoleCodes(u);
            const displayName = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`;
            return {
              id: String(u.id),
              displayName,
              email: u.email || '',
              roleCodes
            };
          });

        setRecipients(mappedRecipients);
      } catch {
        setRecipients([]);
      }
    };

    loadRecipients();
  }, [user?.email, getRoleCodes]);

  const recipientRoleOptions = useMemo(() => [
    { value: 'all', label: t('workflow.create.roleFilter.all', 'All Roles') },
    { value: 'admin_group', label: t('workflow.create.roleFilter.admin', 'Admin + Super Admin') },
    { value: 'hr', label: t('workflow.create.roleFilter.hr', 'HR') },
    { value: 'instructor', label: t('workflow.create.roleFilter.instructor', 'Instructor') }
  ], [t]);

  const filteredRecipients = useMemo(() => {
    if (recipientRoleFilter === 'all') {
      return recipients;
    }

    const userRoles = lookupData['user-roles'] || [];
    
    // Get role codes from lookup data
    const getRoleCodes = (roleKey) => {
      const role = userRoles.find(r => r.code?.toLowerCase() === roleKey.toLowerCase());
      return role ? [role.code.toLowerCase(), roleKey.toLowerCase()] : [roleKey.toLowerCase()];
    };

    return recipients.filter((recipient) => {
      if (recipientRoleFilter === 'admin_group') {
        const adminCodes = getRoleCodes(ROLE_STRINGS.ADMIN);
        const superAdminCodes = getRoleCodes(ROLE_STRINGS.SUPER_ADMIN);
        return recipient.roleCodes.includes('admin_group')
          || recipient.roleCodes.some(code => adminCodes.includes(code))
          || recipient.roleCodes.some(code => superAdminCodes.includes(code));
      }

      if (recipientRoleFilter === 'hr') {
        const hrCodes = getRoleCodes(ROLE_STRINGS.HR);
        return recipient.roleCodes.some(code => hrCodes.includes(code)) 
          || recipient.roleCodes.includes('human_resources');
      }

      if (recipientRoleFilter === 'instructor') {
        const instructorCodes = getRoleCodes(ROLE_STRINGS.INSTRUCTOR);
        return recipient.roleCodes.some(code => instructorCodes.includes(code)) 
          || recipient.roleCodes.includes('teacher');
      }

      return recipient.roleCodes.includes(recipientRoleFilter);
    });
  }, [recipients, recipientRoleFilter, lookupData]);

  const recipientOptions = useMemo(() => {
    return [
      { value: '', label: t('workflow.create.selectRecipient', 'Select recipient') },
      ...filteredRecipients.map((recipient) => ({
        value: recipient.id,
        label: `${recipient.displayName}${recipient.email ? ` (${recipient.email})` : ''}`
      }))
    ];
  }, [filteredRecipients, t]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('workflow.create.titleRequired', 'Title is required');
    }

    if (!formData.documentType) {
      newErrors.documentType = t('workflow.create.typeRequired', 'Document type is required');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('workflow.create.descriptionRequired', 'Description is required');
    }

    if (!recipientId) {
      newErrors.recipientId = t('workflow.create.recipientRequired', 'Recipient is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, recipientId, t]);

  // Handle file upload
  const handleFileUploaded = useCallback((fileData) => {
    setUploadedFile(fileData);
    setFormData(prev => ({
      ...prev,
      nextcloudFileId: fileData.nextcloudFileId,
      nextcloudFilePath: fileData.nextcloudFilePath
    }));
  }, []);

  // Handle file upload error
  const handleFileUploadError = useCallback((error) => {
    triggerNotification('error', error || t('workflow.drive.uploadError', 'Failed to upload file'));
  }, [triggerNotification, t]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await createWorkflowDocument(formData);

      if (result.success) {
        const createdDocumentId = result.data?.id;
        const sendResult = await sendWorkflowDocument(createdDocumentId, {
          receiverId: Number(recipientId),
          comment: sendComment || undefined
        });

        if (sendResult.success) {
          triggerNotification('success', t('workflow.create.sent', 'Document created and sent successfully'));
        } else {
          triggerNotification('warning', sendResult.error || t('workflow.create.sentError', 'Document created but send failed, please send from detail page'));
        }

        navigate(`/workflow/${createdDocumentId}`);
      } else {
        triggerNotification('error', result.error || t('workflow.create.createError', 'Failed to create document'));
      }
    } catch (error) {
      console.error('[WorkflowCreatePage] Error creating document:', error);
      triggerNotification('error', t('workflow.create.createError', 'Failed to create document'));
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, triggerNotification, navigate, recipientId, sendComment, t]);

  // Get icon for document type
  const getDocumentTypeIcon = (type) => {
    return FileText; // Simplified for now
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SimpleLoading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/workflow/inbox')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('workflow.create.backToInbox', 'Back to Inbox')}
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/drive/personal')}
          className="flex items-center gap-2"
        >
          {t('workflow.create.openWorkspace', 'Open Workspace')}
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('workflow.create.title', 'Create Workflow Document')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('workflow.create.description', 'Create a new document for approval workflow')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('workflow.create.documentDetails', 'Document Details')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('workflow.create.title', 'Title')} *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('workflow.create.titlePlaceholder', 'Enter document title...')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('workflow.create.documentType', 'Document Type')} *
              </label>
              <Select
                value={formData.documentType}
                onChange={(valueOrEvent) => handleInputChange('documentType', valueOrEvent?.target?.value ?? valueOrEvent)}
                options={documentTypeOptions}
                className={errors.documentType ? 'border-red-500' : ''}
              />
              {errors.documentType && (
                <p className="text-red-500 text-sm mt-1">{errors.documentType}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('workflow.create.description', 'Description')} *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('workflow.create.descriptionPlaceholder', 'Enter document description...')}
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* File Upload */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('workflow.create.uploadFile', 'Upload File')}
              </h3>
              
              <NextcloudFileUpload
                onFileUploaded={handleFileUploaded}
                onError={handleFileUploadError}
                accept="*"
                maxSize={50 * 1024 * 1024}
              />
              
              {uploadedFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    {t('workflow.create.fileSelected', 'File selected')}: <strong>{uploadedFile.file.name}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Recipient Selection */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t('workflow.create.recipientSection', 'Send To')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('workflow.create.recipientRoleFilter', 'Role Filter')}
                  </label>
                  <Select
                    value={recipientRoleFilter}
                    onChange={(valueOrEvent) => {
                      const value = valueOrEvent?.target?.value ?? valueOrEvent;
                      setRecipientRoleFilter(value);
                      setRecipientId('');
                    }}
                    options={recipientRoleOptions}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('workflow.create.recipient', 'Recipient')} *
                  </label>
                  <Select
                    value={recipientId}
                    onChange={(valueOrEvent) => {
                      const value = valueOrEvent?.target?.value ?? valueOrEvent;
                      setRecipientId(value);
                      if (errors.recipientId) {
                        setErrors((prev) => ({ ...prev, recipientId: '' }));
                      }
                    }}
                    options={recipientOptions}
                    className={errors.recipientId ? 'border-red-500' : ''}
                  />
                  {errors.recipientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipientId}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('workflow.create.sendComment', 'Initial Send Comment')}
                </label>
                <Textarea
                  value={sendComment}
                  onChange={(e) => setSendComment(e.target.value)}
                  placeholder={t('workflow.create.sendCommentPlaceholder', 'Optional note for the recipient')}
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? t('workflow.create.creating', 'Creating...') : t('workflow.create.create', 'Create Document')}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/workflow/inbox')}
                disabled={loading}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Document Type Preview */}
      {formData.documentType && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                {React.createElement(getDocumentTypeIcon(formData.documentType), { className: "h-5 w-5" })}
                {t('workflow.create.preview', 'Preview')}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {React.createElement(getDocumentTypeIcon(formData.documentType), { className: "h-8 w-8" })}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {documentTypeOptions.find(opt => opt.value === formData.documentType)?.label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('workflow.create.selectedType', 'Selected document type')}
                  </p>
                </div>
              </div>
              
              {formData.title && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">
                    {t('workflow.create.titlePreview', 'Title')}
                  </h5>
                  <p className="text-gray-700">{formData.title}</p>
                </div>
              )}
              
              {formData.description && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">
                    {t('workflow.create.descriptionPreview', 'Description')}
                  </h5>
                  <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowCreatePage;
