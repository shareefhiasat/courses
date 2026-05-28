/**
 * Workflow Detail Page
 * 
 * PURPOSE: Display workflow document details with actions and React Flow trace
 * ARCHITECTURE: Page Component → Hook → Service → API
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User,
  FileText,
  MessageSquare,
  History,
  Share2,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { getThemedIcon } from '@constants/iconTypes';
import { getLegacyStatusVariant, LEGACY_WORKFLOW_STATUS } from '@constants/workflowStatusTypes';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import useNotifications from '@hooks/useNotifications';
import { getUsers } from '@services/business/userService';
import { 
  getWorkflowDocumentById,
  sendWorkflowDocument,
  approveWorkflowDocument,
  returnWorkflowDocument,
  closeWorkflowDocument
} from '@services/business/workflowService';
import { Button, useToast } from '@ui';
import { Card, CardContent, CardHeader, CardTitle } from '@ui';
import { Badge } from '@ui';
import { Textarea } from '@ui';
import { Select } from '@ui';
import { LoadingSpinner } from '@ui';
import { Modal } from '@ui';
import { FileUpload } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';

const WorkflowDetailPage = () => {
  const { t } = useLang();
  const { theme } = useTheme();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerNotification } = useNotifications();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [comment, setComment] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [recipientRoleFilter, setRecipientRoleFilter] = useState('all');
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch document details
  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getWorkflowDocumentById(documentId);
      
      if (result.success) {
        setDocument(result.data);
      } else {
        setError(result.error || 'Failed to fetch document');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Load document on mount
  React.useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Load recipients for send/resubmit actions
  React.useEffect(() => {
    const loadRecipients = async () => {
      try {
        const normalizeRoleToken = (value) => String(value || '')
          .toLowerCase()
          .replace(/[\s-]+/g, '_')
          .trim();

        const expandRoleAliases = (roleCode) => {
          const normalized = normalizeRoleToken(roleCode);
          if (!normalized) return [];

          const aliases = new Set([normalized]);
          if (normalized === 'superadmin') aliases.add('super_admin');
          if (normalized === 'humanresources') aliases.add('human_resources');
          if (normalized === 'teacher') aliases.add('instructor');
          if (normalized === 'admin' || normalized === 'super_admin') aliases.add('admin_group');
          return Array.from(aliases);
        };

        const result = await getUsers({ limit: 200 });
        if (result?.success && Array.isArray(result.data)) {
          const currentUserEmail = (user?.email || '').toLowerCase();
          const options = result.data
            .filter((u) => (u.email || '').toLowerCase() !== currentUserEmail)
            .map((u) => {
              const displayName = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`;
              const emailSuffix = u.email ? ` (${u.email})` : '';
              const roleTokens = [
                ...(Array.isArray(u.roles) ? u.roles : []),
                ...(Array.isArray(u.roleAssignments) ? u.roleAssignments.map((assignment) => assignment?.role?.code).filter(Boolean) : []),
                ...(u.primaryRole?.code ? [u.primaryRole.code] : []),
                ...(u.role ? [u.role] : []),
                ...(u.userRole ? [u.userRole] : [])
              ];

              return {
                value: String(u.id),
                label: `${displayName}${emailSuffix}`,
                roleCodes: Array.from(new Set(roleTokens.flatMap(expandRoleAliases).filter(Boolean)))
              };
            });

          setRecipientOptions(options);
        }
      } catch (e) {
        setRecipientOptions([]);
      }
    };

    loadRecipients();
  }, [user?.email]);

  const roleFilterOptions = useMemo(() => ([
    { value: 'all', label: t('workflow.detail.roleAll', 'All Roles') },
    { value: 'admin_group', label: t('workflow.detail.roleAdmin', 'Admin + Super Admin') },
    { value: 'hr', label: t('workflow.detail.roleHr', 'HR') },
    { value: 'instructor', label: t('workflow.detail.roleInstructor', 'Instructor') }
  ]), [t]);

  const filteredRecipientOptions = useMemo(() => {
    if (recipientRoleFilter === 'all') {
      return recipientOptions;
    }

    return recipientOptions.filter((option) => {
      const roleCodes = (option.roleCodes || []).map((role) => String(role).toLowerCase());
      if (recipientRoleFilter === 'admin_group') {
        return roleCodes.includes('admin_group') || roleCodes.includes('admin') || roleCodes.includes('super_admin');
      }

      if (recipientRoleFilter === 'hr') {
        return roleCodes.includes('hr') || roleCodes.includes('human_resources');
      }

      if (recipientRoleFilter === 'instructor') {
        return roleCodes.includes('instructor') || roleCodes.includes('teacher');
      }

      return roleCodes.includes(recipientRoleFilter);
    });
  }, [recipientOptions, recipientRoleFilter]);

  // Status badge variants - using centralized legacy workflow status constants
  const getStatusVariant = (status) => {
    return getLegacyStatusVariant(status);
  };

  // Action icons
  const getActionIcon = (action) => {
    switch (action) {
      case 'send':
        return <Send className="h-4 w-4" />;
      case 'approve':
        return <CheckCircle className="h-4 w-4" />;
      case 'return':
        return <AlertCircle className="h-4 w-4" />;
      case 'close':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Available actions based on current status and user role
  const availableActions = useMemo(() => {
    if (!document) return [];

    const actions = [];
    const currentStatus = document.currentStatus;
    const currentUserEmail = (user?.email || '').toLowerCase();
    const isOwner = (document.currentOwner?.email || '').toLowerCase() === currentUserEmail;
    const isAssignee = (document.currentAssignee?.email || '').toLowerCase() === currentUserEmail;
    const isCreator = (document.creator?.email || '').toLowerCase() === currentUserEmail;

    // Draft actions (creator can send)
    if (currentStatus === 'draft' && isCreator) {
      actions.push({
        id: 'send',
        label: t('workflow.actions.send', 'Send'),
        icon: <Send className="h-4 w-4" />,
        variant: 'primary',
        requiresUser: true
      });
    }

    // Pending actions (assignee can approve/return)
    if (currentStatus === 'pending' && isAssignee) {
      actions.push({
        id: 'approve',
        label: t('workflow.actions.approve', 'Approve'),
        icon: <CheckCircle className="h-4 w-4" />,
        variant: 'success'
      });
      actions.push({
        id: 'return',
        label: t('workflow.actions.return', 'Return'),
        icon: <AlertCircle className="h-4 w-4" />,
        variant: 'destructive'
      });
    }

    // Revise needed actions (creator can send again)
    if ((currentStatus === 'returned' || currentStatus === 'revise_needed') && isCreator) {
      actions.push({
        id: 'send',
        label: t('workflow.actions.resubmit', 'Resubmit'),
        icon: <Send className="h-4 w-4" />,
        variant: 'primary',
        requiresUser: true
      });
    }

    // Approved actions (owner can close)
    if (currentStatus === 'approved' && isOwner) {
      actions.push({
        id: 'close',
        label: t('workflow.actions.close', 'Close'),
        icon: <Clock className="h-4 w-4" />,
        variant: 'outline'
      });
    }

    return actions;
  }, [document, user?.email, t]);

  // Handle workflow action
  const handleAction = async (action) => {
    if (action.requiresUser && !selectedUser) {
      triggerNotification('error', t('workflow.detail.selectUser', 'Please select a user'));
      return;
    }

    setActionLoading(true);
    
    try {
      let result;
      const actionData = { comment };

      switch (action.id) {
        case 'send':
          result = await sendWorkflowDocument(documentId, {
            receiverId: Number(selectedUser),
            comment
          });
          break;
        case 'approve':
          result = await approveWorkflowDocument(documentId, actionData);
          break;
        case 'return':
          result = await returnWorkflowDocument(documentId, actionData);
          break;
        case 'close':
          result = await closeWorkflowDocument(documentId, actionData);
          break;
        default:
          throw new Error('Unknown action');
      }

      if (result.success) {
        triggerNotification('success', t(`workflow.actions.${action.id}Success`, `Document ${action.id} successfully`));
        setActionModal(null);
        setComment('');
        setSelectedUser('');
        fetchDocument(); // Refresh document data
      } else {
        triggerNotification('error', result.error || t('workflow.detail.actionError', 'Action failed'));
      }
    } catch (err) {
      triggerNotification('error', err.message || t('workflow.detail.actionError', 'Action failed'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('workflow.detail.error', 'Error')}
        </h3>
        <p className="text-gray-600 mb-4">{error || t('workflow.detail.notFound', 'Document not found')}</p>
        <Button onClick={() => navigate('/workflow/inbox')}>
          {t('workflow.detail.backToInbox', 'Back to Inbox')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/workflow/inbox')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back', 'Back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {document.title}
            </h1>
            <p className="text-gray-600">{document.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(document.currentStatus)}>
            {t(`workflow.status.${document.currentStatus}`, document.currentStatus)}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('workflow.detail.documentInfo', 'Document Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t('workflow.detail.type', 'Type')}
                  </label>
                  <p className="text-gray-900">
                    {t(`workflow.types.${document.documentType}`, document.documentType)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t('workflow.detail.status', 'Status')}
                  </label>
                  <p className="text-gray-900">
                    {t(`workflow.status.${document.currentStatus}`, document.currentStatus)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t('workflow.detail.creator', 'Creator')}
                  </label>
                  <p className="text-gray-900">
                    {document.creator?.displayName || document.creator?.firstName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t('workflow.detail.currentOwner', 'Current Owner')}
                  </label>
                  <p className="text-gray-900">
                    {document.currentOwner?.displayName || document.currentOwner?.firstName || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t('workflow.detail.currentAssignee', 'Current Assignee')}
                  </label>
                  <p className="text-gray-900">
                    {document.currentAssignee?.displayName || document.currentAssignee?.firstName || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t('workflow.detail.created', 'Created')}
                  </label>
                  <p className="text-gray-900">
                    {formatQatarDate(new Date(document.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {availableActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('workflow.detail.availableActions', 'Available Actions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {availableActions.map(action => (
                    <Button
                      key={action.id}
                      variant={action.variant}
                      onClick={() => setActionModal(action)}
                      className="flex items-center gap-2"
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Trace (React Flow placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('workflow.detail.workflowTrace', 'Workflow Trace')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {t('workflow.detail.reactFlowPlaceholder', 'React Flow visualization will be implemented here')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Preview */}
          {document.nextcloudFilePath && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t('workflow.detail.documentPreview', 'Document Preview')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center px-4">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {t('workflow.detail.nextcloudPreview', 'Nextcloud document preview will be embedded here')}
                    </p>
                    <p className="text-sm text-gray-500 mt-2 break-all">
                      {document.nextcloudFilePath}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('workflow.detail.actionHistory', 'Action History')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(document.actions?.length > 0) ? document.actions.map(action => (
                  <div key={action.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(action.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {t(`workflow.actions.${action.action}`, action.action)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatQatarDate(new Date(action.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {t('workflow.detail.fromTo', 'From {from} to {to}', {
                          from: action.sender?.displayName || action.sender?.firstName || '-',
                          to: action.receiver?.displayName || action.receiver?.firstName || '-'
                        })}
                      </div>
                      {action.comment && (
                        <div className="text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded">
                          {action.comment}
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm">
                    {t('workflow.detail.noActions', 'No actions yet')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Versions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('workflow.detail.versions', 'Versions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(document.versions?.length > 0) ? document.versions.map(version => (
                  <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {t('workflow.detail.version', 'Version {number}', { number: version.versionNumber })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatQatarDate(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                      </div>
                      {version.notes && (
                        <div className="text-sm text-gray-600 mt-1">{version.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm">
                    {t('workflow.detail.noVersions', 'No versions yet')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <Modal
          title={t('workflow.detail.actionModal.title', 'Perform Action')}
          onClose={() => {
            setActionModal(null);
            setComment('');
            setSelectedUser('');
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {actionModal.icon}
              <div>
                <div className="font-medium">{actionModal.label}</div>
                <div className="text-sm text-gray-600">
                  {t(`workflow.actions.${actionModal.id}.description`, `Perform ${actionModal.id} action`)}
                </div>
              </div>
            </div>

            {actionModal.requiresUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('workflow.detail.selectRecipient', 'Select Recipient')}
                </label>
                <Select
                  value={recipientRoleFilter}
                  onChange={(valueOrEvent) => {
                    const value = valueOrEvent?.target?.value ?? valueOrEvent;
                    setRecipientRoleFilter(value);
                    setSelectedUser('');
                  }}
                  options={roleFilterOptions}
                  className="w-full mb-2"
                />
                <Select
                  value={selectedUser}
                  onChange={(valueOrEvent) => setSelectedUser(valueOrEvent?.target?.value ?? valueOrEvent)}
                  options={[
                    { value: '', label: t('workflow.detail.chooseUser', 'Choose a user...') },
                    ...filteredRecipientOptions
                  ]}
                  className="w-full"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('workflow.detail.comment', 'Comment')}
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('workflow.detail.commentPlaceholder', 'Add a comment...')}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setActionModal(null);
                  setComment('');
                  setSelectedUser('');
                }}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant={actionModal.variant}
                onClick={() => handleAction(actionModal)}
                disabled={actionLoading || (actionModal.requiresUser && !selectedUser)}
              >
                {actionLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  actionModal.label
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkflowDetailPage;
