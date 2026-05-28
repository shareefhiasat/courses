import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_STORAGE_LIMIT, DRIVE_SPACES, getRefreshHandler } from '@constants/driveConstants';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon } from '@constants/iconTypes';
import { getSmartDriveWorkflowStatusIcon, getSmartDriveWorkflowStatusStyle, getSmartDriveWorkflowStatusDescription } from '@constants/workflowStatusTypes';
import { Input, Button } from '@ui';
import DriveSpacesSidebar from '@components/smart-drive/DriveSpacesSidebar';
import FileRoster from '@components/smart-drive/FileRoster';
import InboxDrawer from '@components/smart-drive/InboxDrawer';
import FileDetailsModal from '@components/smart-drive/FileDetailsModal';
import UploadModal from '@components/smart-drive/UploadModal';
import CreateFolderModal from '@components/smart-drive/CreateFolderModal';
import FilterChips from '@components/smart-drive/FilterChips';
import FilterMenu from '@components/smart-drive/FilterMenu';
import FileRosterSkeleton from '@components/smart-drive/FileRosterSkeleton';
import EmptyState from '@components/smart-drive/EmptyState';
import ToastContainer from '@components/smart-drive/ToastContainer';
import CustomWorkflowDialog from '@components/workflow/CustomWorkflowDialog';
import { createCustomWorkflow } from '@services/business/workflowDocumentService';
import { info, error as logError } from '@services/utils/logger';
import useDriveFiles from '@hooks/useDriveFiles';
import useWorkflowTasks from '@hooks/useWorkflowTasks';
import useUpload from '@hooks/useUpload';
import useFilters from '@hooks/useFilters';
import useToast from '@hooks/useToast';
import useKeyboardShortcuts from '@hooks/useKeyboardShortcuts';

export default function SmartDrivePage() {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug current user
  console.log('[SmartDrivePage] Current user:', {
    id: user?.id,
    email: user?.email,
    displayName: user?.displayName,
    username: user?.username
  });

  const [activeSpace, setActiveSpace] = useState('my-drive');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  console.log('[SmartDrivePage] Component render, activeSpace:', activeSpace, 'folderTree:', folderTree);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [detailsModalFile, setDetailsModalFile] = useState(null);
  const [detailsModalInitialTab, setDetailsModalInitialTab] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [openFilterChip, setOpenFilterChip] = useState(null);
  const filterChipRefs = useRef({});
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [selectedFileForWorkflow, setSelectedFileForWorkflow] = useState(null);

  // Real data hooks
  const {
    files: allFiles,
    folders,
    loading: filesLoading,
    error: filesError,
    fetchFiles,
    fetchFolders,
    fetchFolderTree,
    getFolderDetails,
    refreshFiles,
    starFile,
    starFolder,
    trashFile,
    restoreFile,
    permanentDeleteFile,
    downloadFile,
    shareFile,
    createPublicLink,
    createFolder,
    renameFolder,
    renameFile,
    deleteFolder,
    shareFolder,
  } = useDriveFiles(activeSpace, currentFolderId);

  const {
    filters,
    addFilter,
    removeFilter,
    clearAllFilters,
    toAPIParams,
  } = useFilters();

  const { toasts, success, error, hideToast } = useToast();

  const {
    tasks: workflowTasks,
    unreadCount,
    approveTask,
    rejectTask,
  } = useWorkflowTasks();

  useEffect(() => {
    const filterParams = toAPIParams();
    fetchFiles(filterParams);
    fetchFolders();
  }, [fetchFiles, fetchFolders, toAPIParams]);

  useEffect(() => {
    console.log('[SmartDrivePage] Folder tree useEffect triggered, activeSpace:', activeSpace);
    const loadFolderTree = async () => {
      console.log('[SmartDrivePage] loadFolderTree called, activeSpace:', activeSpace);
      if (activeSpace === 'my-drive') {
        console.log('[SmartDrivePage] Fetching folder tree...');
        const tree = await fetchFolderTree();
        console.log('[SmartDrivePage] Folder tree received:', tree);
        setFolderTree(tree);
      } else {
        console.log('[SmartDrivePage] Skipping folder tree, not my-drive');
        setFolderTree([]);
      }
    };
    loadFolderTree();
  }, [activeSpace, fetchFolderTree]);

  useEffect(() => {
    let mounted = true;

    const loadBreadcrumbs = async () => {
      if (!currentFolderId) {
        setBreadcrumbs([]);
        return;
      }

      console.log('[Breadcrumb Debug] Loading breadcrumbs for folder:', currentFolderId);
      const result = await getFolderDetails(currentFolderId);
      console.log('[Breadcrumb Debug] API result:', result);
      console.log('[Breadcrumb Debug] result.payload:', result.payload);
      console.log('[Breadcrumb Debug] result.payload?.breadcrumb:', result.payload?.breadcrumb);
      if (mounted && result.success) {
        setBreadcrumbs(result.payload?.breadcrumb || []);
      }
    };

    loadBreadcrumbs();

    return () => {
      mounted = false;
    };
  }, [currentFolderId, getFolderDetails]);

  useEffect(() => {
    let timeoutId;
    const onResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsMobile(window.innerWidth <= 768), 120);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Compute storage usage from real files
  const storageUsage = useMemo(
    () => (allFiles || []).reduce((sum, f) => sum + (f.size || 0), 0),
    [allFiles]
  );
  const storageLimit = DEFAULT_STORAGE_LIMIT;

  const visibleFiles = useMemo(() => {
    return allFiles || [];
  }, [allFiles]);

  // Compute folder-specific storage (only files in current folder)
  const folderStorage = useMemo(
    () => (visibleFiles || []).reduce((sum, f) => sum + (f.size || 0), 0),
    [visibleFiles]
  );

  // Aggregate workflow status counts across all visible files
  const workflowStatusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      rejected: 0,
      needs_feedback: 0,
    };
    visibleFiles.forEach(file => {
      if (file.workflowCounts) {
        counts.pending += file.workflowCounts.pending || 0;
        counts.in_progress += file.workflowCounts.in_progress || 0;
        counts.completed += file.workflowCounts.completed || 0;
        counts.rejected += file.workflowCounts.rejected || 0;
        counts.needs_feedback += file.workflowCounts.needs_feedback || 0;
      }
    });
    return counts;
  }, [visibleFiles]);

  const getWorkflowStatusIcon = (status) => {
    return getSmartDriveWorkflowStatusIcon(status);
  };

  const getWorkflowStatusStyle = (status) => {
    return getSmartDriveWorkflowStatusStyle(status);
  };

  const getWorkflowStatusDescription = (status) => {
    return getSmartDriveWorkflowStatusDescription(status, t);
  };

  const visibleFolders = useMemo(() => {
    let result = activeSpace === 'my-drive' ? folders || [] : [];
    const hasStarredFilter = filters.some(f => f.type === 'status' && f.value === 'starred');
    if (hasStarredFilter) {
      result = result.filter(f => f.starred);
    }
    console.log('[SmartDrivePage] visibleFolders:', result, 'activeSpace:', activeSpace, 'folders:', folders);
    return result;
  }, [activeSpace, folders, filters]);

  const {
    uploads,
    uploading,
    addToQueue,
    startUpload,
    removeUpload,
    clearCompleted,
  } = useUpload(visibleFiles);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    const allIds = [...visibleFolders, ...visibleFiles].map(item => item.id);
    setSelectedIds(checked ? new Set(allIds) : new Set());
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const handleSpaceChange = (space) => {
    setActiveSpace(space);
    setCurrentFolderId(null);
    setBreadcrumbs([]);
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  const handleFolderOpen = (folder) => {
    if (!folder?.id) return;
    setActiveSpace('my-drive');
    setCurrentFolderId(folder.id);
    setSelectedIds(new Set());
  };

  const handleBreadcrumbOpen = (folderId) => {
    setCurrentFolderId(folderId);
    setSelectedIds(new Set());
  };

  const handleGoUp = () => {
    if (breadcrumbs.length <= 1) {
      handleBreadcrumbOpen(null);
      return;
    }
    handleBreadcrumbOpen(breadcrumbs[breadcrumbs.length - 2]?.id || null);
  };

  const handleFileAction = async (action, items) => {
    if (action === 'new-folder') {
      setCreateFolderModalOpen(true);
      return;
    }
    if (action === 'star') {
      await Promise.all(items.map((item) => {
        if (item.path !== undefined) {
          // It's a folder
          return starFolder(item.id);
        } else {
          // It's a file
          return starFile(item.id);
        }
      }));
    } else if (action === 'open') {
      const item = items[0];
      if (item && item.path === undefined) {
        // It's a file - open preview
        setDetailsModalFile(item);
      }
    } else if (action === 'rename') {
      // Handle rename for single item
      const item = items[0];
      if (item) {
        // For files, show name without extension in the input
        const isFile = item.path === undefined;
        const displayName = isFile ? item.name.replace(/\.[^/.]+$/, '') : item.name;
        setNewName(displayName);
        setRenameTarget(item);
        setRenameError('');
      }
    } else if (action === 'delete' || action === 'trash') {
      setItemsToDelete(items);
      setDeleteConfirmOpen(true);
    } else if (action === 'restore') {
      await Promise.all(items.map((item) => {
        if (item.path !== undefined) {
          // It's a folder
          return restoreFolder(item.id);
        } else {
          // It's a file
          return restoreFile(item.id);
        }
      }));
    } else if (action === 'download') {
      await Promise.all(items.map((item) => {
        // Only download files, not folders
        if (item.path === undefined) {
          return downloadFile(item.id);
        }
        return Promise.resolve();
      }));
    } else if (action === 'share') {
      if (items.length === 1) {
        const item = items[0];
        if (item.path === undefined) {
          // It's a file - open details modal on share tab
          setDetailsModalFile(item);
          setDetailsModalInitialTab('share');
        }
      }
    } else if (action === 'create-workflow') {
      if (items.length === 1) {
        const item = items[0];
        if (item.path === undefined) {
          // It's a file - open workflow dialog
          setSelectedFileForWorkflow(item);
          setShowWorkflowDialog(true);
        }
      }
    }
  };

  const handleFolderAction = async (folder, action) => {
    if (action === 'delete') {
      const result = await deleteFolder(folder.id);
      if (result.success) {
        success(t('drive.folderDeleted'));
      } else {
        error(t('drive.deleteFolderFailed'));
      }
    } else if (action === 'rename') {
      setNewName(folder.name);
      setRenameTarget(folder);
    } else if (action === 'share') {
      // Folders don't have share tab yet - show toast
      info(t('drive.folderShareNotAvailable') || 'Folder sharing not available');
    }
  };

  const handleStar = async (id, type) => {
    if (type === 'folder') {
      return await starFolder(id);
    } else {
      return await starFile(id);
    }
  };

  const handleShare = async (shareData) => {
    let result;
    if (shareData.path !== undefined) {
      // It's a folder
      result = await shareFolder(shareData.id, shareData);
    } else {
      // It's a file
      result = await shareFile(shareData.id, shareData);
    }
    if (result.success) {
      refreshFiles();
      success(t('drive.shareSuccess'));
    } else {
      error(t('drive.shareFailed'));
    }
    return result;
  };

  const handleGeneratePublicLink = async (fileId, expiryDays) => {
    const result = await createPublicLink(fileId, { expiryDays });
    return result.success ? result.payload : result;
  };

  const handleFileOpen = async (file) => {
    // Fetch fresh file data to get latest version info
    try {
      const data = await apiService.get(`/drive/files/${file.id}`);
      if (data.success && data.payload) {
        setDetailsModalFile(data.payload);
      } else {
        // Fallback to original file if fetch fails
        setDetailsModalFile(file);
      }
    } catch (error) {
      console.error('[SmartDrivePage] Error fetching fresh file data:', error);
      // Fallback to original file if fetch fails
      setDetailsModalFile(file);
    }
  };

  const handleUpload = () => {
    setUploadModalOpen(true);
  };

  const handleWorkflowSubmit = useCallback(async (workflowData) => {
    console.log('🟣 [SmartDrivePage] Workflow submit initiated', {
      selectedFileForWorkflow,
      workflowData,
      hasFile: !!selectedFileForWorkflow,
      fileName: selectedFileForWorkflow?.name || selectedFileForWorkflow?.fileName,
      fileId: selectedFileForWorkflow?.id || selectedFileForWorkflow?.fileId
    });

    try {
      console.log('🟣 [SmartDrivePage] Calling createCustomWorkflow...');
      const result = await createCustomWorkflow(selectedFileForWorkflow, workflowData);
      console.log('🟣 [SmartDrivePage] createCustomWorkflow returned:', result);

      if (result.success) {
        console.log('✅ [SmartDrivePage] Workflow created successfully', {
          documentId: result.data?.document?.id,
          fullData: result.data
        });
        
        success(t('drive.workflowCreated', 'Workflow created successfully'));
        setShowWorkflowDialog(false);
        setSelectedFileForWorkflow(null);
        refreshFiles();

        // Navigate to workflow document detail page
        const docId = result.data?.document?.id;
        console.log('🟣 [SmartDrivePage] Navigating to:', `/workflow-documents/${docId}`);
        navigate(`/workflow-documents/${docId}`);
      } else {
        console.error('❌ [SmartDrivePage] Workflow creation failed', {
          error: result.error,
          fullResult: result
        });
        error(result.error || t('drive.workflowCreationFailed', 'Failed to create workflow'));
      }
    } catch (err) {
      console.error('❌ [SmartDrivePage] Error creating workflow', {
        error: err.message,
        stack: err.stack,
        fullError: err
      });
      error(t('drive.workflowCreationError', 'Error creating workflow'));
    }
  }, [t, success, error, selectedFileForWorkflow, refreshFiles]);

  const handleAddFilesToQueue = (files) => {
    addToQueue(files, activeSpace === 'my-drive' ? currentFolderId : null);
  };

  const handleStartUpload = async () => {
    await startUpload();
    refreshFiles();
    success(t('drive.uploadComplete'));
  };

  const handleEmptyTrash = async () => {
    const trashedFiles = visibleFiles.filter(f => f.isDeleted);
    if (trashedFiles.length === 0) return;
    setEmptyTrashConfirmOpen(true);
  };

  const confirmEmptyTrash = async () => {
    const trashedFiles = visibleFiles.filter(f => f.isDeleted);
    if (trashedFiles.length === 0) return;
    await Promise.all(trashedFiles.map(f => permanentDeleteFile(f.id)));
    refreshFiles();
    setEmptyTrashConfirmOpen(false);
    success(t('drive.trashEmptied') || 'Trash emptied');
  };

  const confirmDelete = async () => {
    await Promise.all(itemsToDelete.map((item) => {
      if (item.path !== undefined) {
        // It's a folder
        return deleteFolder(item.id);
      } else {
        // It's a file
        return trashFile(item.id);
      }
    }));
    handleClearSelection();
    setDeleteConfirmOpen(false);
    setItemsToDelete([]);
    success(t('drive.deleteSuccess') || 'Items moved to trash');
  };

  const handleCreateFolder = async (name, parentId) => {
    const result = await createFolder(name, parentId);
    if (result.success) {
      refreshFiles();
      success(t('drive.folderCreated'));
    } else {
      error(t('drive.createFolderFailed'));
    }
    return result;
  };

  // Close filter chip dropdowns on outside click
  useEffect(() => {
    if (!openFilterChip) return;
    const handler = (e) => {
      const ref = filterChipRefs.current[openFilterChip];
      if (ref && !ref.contains(e.target)) setOpenFilterChip(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openFilterChip]);

  const quickFilterCategories = [
    {
      key: 'type', label: t('drive.type'), icon: 'file_text',
      options: [
        { value: 'images', label: t('drive.filter.type.images'), icon: 'image' },
        { value: 'documents', label: t('drive.filter.type.documents'), icon: 'file_text' },
        { value: 'videos', label: t('drive.filter.type.videos'), icon: 'video' },
        { value: 'audio', label: t('drive.filter.type.audio'), icon: 'music' },
        { value: 'archives', label: t('drive.filter.type.archives'), icon: 'archive' },
      ],
    },
    {
      key: 'people', label: t('drive.people'), icon: 'users',
      options: [
        { value: 'me', label: t('drive.filter.owner.me'), icon: 'user' },
        { value: 'shared', label: t('drive.filter.owner.shared'), icon: 'users' },
      ],
    },
    {
      key: 'modified', label: t('drive.modified'), icon: 'clock',
      options: [
        { value: 'today', label: t('drive.filter.date.today'), icon: 'clock' },
        { value: 'week', label: t('drive.filter.date.week'), icon: 'calendar' },
        { value: 'month', label: t('drive.filter.date.month'), icon: 'calendar' },
        { value: 'year', label: t('drive.filter.date.year'), icon: 'calendar' },
      ],
    },
    {
      key: 'status', label: t('drive.status'), icon: 'star',
      options: [
        { value: 'starred', label: t('drive.filter.status.starred'), icon: 'star' },
        { value: 'recent', label: t('drive.filter.status.recent'), icon: 'clock' },
        { value: 'trash', label: t('drive.filter.status.trash'), icon: 'trash' },
        { value: 'has-workflow', label: t('drive.filter.status.hasWorkflow'), icon: 'workflow', color: '#8b5cf6' },
      ],
    },
  ];

  const filterTypeToKey = { type: 'type', people: 'owner', modified: 'date', status: 'status' };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => document.querySelector('input[type="text"]')?.focus(),
    onUpload: handleUpload,
    onNewFolder: () => setCreateFolderModalOpen(true),
    onSelectAll: () => handleSelectAll(true),
    onDelete: () => {
      if (selectedIds.size > 0) {
        handleFileAction('trash', selectedIds);
      }
    },
    onEscape: () => {
      if (selectedIds.size > 0) handleClearSelection();
      if (detailsModalFile) setDetailsModalFile(null);
    },
  });

  const gradientBtn = {
    padding: '0.65rem 1rem',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div
      className="qr-scanner-container"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: 'var(--background-secondary, #f9fafb)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          background: 'var(--panel, white)',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '1600px',
            margin: '0 auto',
            flexWrap: 'wrap',
          }}
        >
          {/* Title / Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              {getThemedIcon('ui', 'hard_drive', 20, 'white')}
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text, #111827)',
                }}
              >
                {t('drive.title') || 'Smart Drive'}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #6b7280)',
                }}
              >
                {t('drive.subtitle') || 'Secure file storage & sharing'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '220px', maxWidth: '560px' }}>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('drive.searchInDrive') || 'Search in Drive'}
              prefix={getThemedIcon('ui', 'search', 16, theme)}
            />
          </div>

          <div style={{ flex: '1', minWidth: '1rem' }} />

          {/* Sidebar collapse toggle */}
          {!isMobile && (
            <button
              onClick={() => setSidebarMinimized((v) => !v)}
              title={sidebarMinimized ? t('expand') || 'Expand' : t('collapse') || 'Collapse'}
              style={{
                padding: '0.5rem',
                background: 'var(--background-secondary, #f3f4f6)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getThemedIcon('ui', sidebarMinimized ? 'chevron_right' : 'chevron_left', 16, theme)}
            </button>
          )}

          {/* Inbox/Notifications */}
          <button
            onClick={() => setInboxOpen(true)}
            style={{
              position: 'relative',
              padding: '0.65rem',
              background: 'var(--background-secondary, #f3f4f6)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={t('Pending Approvals')}
          >
            {getThemedIcon('ui', 'bell', 20, theme)}
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  borderRadius: '999px',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Action buttons */}
          <button
            onClick={handleUpload}
            style={{
              ...gradientBtn,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.25)';
            }}
          >
            {getThemedIcon('ui', 'upload', 16, 'white')}
            {t('drive.upload') || 'Upload'}
          </button>

          <button
            onClick={() => handleFileAction('new-folder', [])}
            style={{
              ...gradientBtn,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.25)';
            }}
          >
            {getThemedIcon('ui', 'folder', 16, 'white')}
            {t('drive.newFolder') || 'New Folder'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div
        style={{
          padding: isMobile ? '0.75rem' : '1.5rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1.5rem',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: isMobile ? '100%' : sidebarMinimized ? '72px' : '15%',
            flexShrink: 0,
            transition: 'width 0.3s ease',
          }}
        >
          <DriveSpacesSidebar
            activeSpace={activeSpace}
            onSpaceChange={handleSpaceChange}
            storageUsage={storageUsage}
            storageLimit={storageLimit}
            folderStorage={folderStorage}
            folders={folders}
            folderTree={folderTree}
            onFolderSelect={handleFolderOpen}
            onUploadClick={handleUpload}
            isMinimized={!isMobile && sidebarMinimized}
            currentFolderId={currentFolderId}
          />
        </aside>

        {/* Main */}
        <main
          style={{
            width: isMobile
              ? '100%'
              : sidebarMinimized
              ? 'calc(100% - 72px - 1.5rem)'
              : '85%',
            transition: 'width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1.5rem' : '2rem',
          }}
        >
          {/* Google-like breadcrumb */}
          {(activeSpace === 'my-drive' || currentFolderId) && (
            <div
              style={{
                background: 'var(--background-secondary, #f9fafb)',
                border: '1px solid var(--border-light, #f3f4f6)',
                borderRadius: '0.5rem',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => handleBreadcrumbOpen(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: currentFolderId ? 'var(--color-primary, #2563eb)' : 'var(--text, #111827)',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: 600,
                    padding: '0.375rem 0.625rem',
                    borderRadius: '0.375rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => {
                    if (!currentFolderId) e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)';
                  }}
                  onMouseLeave={(e) => {
                    if (!currentFolderId) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {getThemedIcon('ui', 'folder', 16, currentFolderId ? 'primary' : theme)}
                  <span>{t('drive.myDrive') || 'My Drive'}</span>
                </button>
                {console.log('[Breadcrumb Debug] currentFolderId:', currentFolderId, 'breadcrumbs:', breadcrumbs, 'breadcrumbs.length:', breadcrumbs.length)}
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    {console.log('[Breadcrumb Debug] Rendering crumb:', crumb, 'idx:', idx)}
                    <span style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.875rem', flexShrink: 0 }}>
                      {getThemedIcon('ui', 'chevron_right', 14, 'muted')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBreadcrumbOpen(crumb.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: crumb.id === currentFolderId ? 'var(--text, #111827)' : 'var(--color-primary, #2563eb)',
                        cursor: 'pointer',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: crumb.id === currentFolderId ? 600 : 500,
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.375rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                      onMouseEnter={(e) => {
                        if (crumb.id !== currentFolderId) e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)';
                      }}
                      onMouseLeave={(e) => {
                        if (crumb.id !== currentFolderId) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {getThemedIcon('ui', 'folder', 16, crumb.id === currentFolderId ? theme : 'primary')}
                      <span>{crumb.name}</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
              {currentFolderId && (
                <button
                  type="button"
                  onClick={handleGoUp}
                  style={{
                    flexShrink: 0,
                    padding: '0.375rem 0.75rem',
                    background: 'var(--background-secondary, #f3f4f6)',
                    border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-secondary, #374151)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  {getThemedIcon('ui', 'chevron_up', 14, theme)}
                  {t('drive.goUp') || 'Go up'}
                </button>
              )}
            </div>
          )}

          {/* Filter bar — merged quick filters + add filter + active chips */}
          <div
            style={{
              background: 'var(--panel, white)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.75rem',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            {quickFilterCategories.map((chip) => (
              <div key={chip.key} ref={(el) => { filterChipRefs.current[chip.key] = el; }} style={{ position: 'relative' }}>
                <button
                  onClick={() => setOpenFilterChip(openFilterChip === chip.key ? null : chip.key)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    background: openFilterChip === chip.key ? 'var(--color-primary-alpha, rgba(37,99,235,0.1))' : 'var(--background-secondary, #f3f4f6)',
                    color: openFilterChip === chip.key ? 'var(--color-primary, #2563eb)' : 'var(--text-secondary, #374151)',
                    border: openFilterChip === chip.key ? '1px solid var(--color-primary, #2563eb)' : '1px solid var(--border, #e5e7eb)',
                    borderRadius: '999px',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.12s',
                  }}
                >
                  {getThemedIcon('ui', chip.icon, 14, theme)}
                  {chip.label}
                  {getThemedIcon('ui', openFilterChip === chip.key ? 'chevron_up' : 'chevron_down', 12, theme)}
                </button>

                {openFilterChip === chip.key && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.375rem)',
                      insetInlineStart: 0,
                      minWidth: '200px',
                      padding: '0.375rem',
                      background: 'var(--panel, white)',
                      border: '1px solid var(--border, #e5e7eb)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 50,
                    }}
                  >
                    {chip.options.map((opt) => {
                      const isActive = filters.some(
                        f => f.type === filterTypeToKey[chip.key] && f.value === opt.value
                      );
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            if (isActive) removeFilter({ type: filterTypeToKey[chip.key], value: opt.value });
                            else addFilter({ type: filterTypeToKey[chip.key], value: opt.value });
                            setOpenFilterChip(null);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.625rem',
                            padding: '0.5rem 0.75rem',
                            height: '2.5rem',
                            border: 'none',
                            borderRadius: '0.5rem',
                            background: isActive ? 'var(--color-primary-alpha, rgba(37,99,235,0.08))' : 'transparent',
                            color: isActive ? 'var(--color-primary, #2563eb)' : 'var(--text, #111827)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 400,
                            textAlign: 'start',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = isActive ? 'var(--color-primary-alpha, rgba(37,99,235,0.12))' : 'var(--background-secondary, #f3f4f6)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = isActive ? 'var(--color-primary-alpha, rgba(37,99,235,0.08))' : 'transparent'}
                        >
                          <div style={{ width: '1.25rem', height: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isActive ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                  <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              getThemedIcon('ui', opt.icon, 14, theme)
                            )}
                          </div>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <FilterMenu onAddFilter={addFilter} />
            <FilterChips
              activeFilters={filters}
              onRemoveFilter={removeFilter}
              onClearAll={clearAllFilters}
            />
          </div>

          {/* Workflow status summary */}
          {activeSpace === 'workflow' && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
              {Object.entries(workflowStatusCounts).map(([status, count]) => {
                if (count === 0) return null;
                const StatusIcon = getWorkflowStatusIcon(status);
                const statusStyle = getWorkflowStatusStyle(status);
                return (
                  <div
                    key={status}
                    title={getWorkflowStatusDescription(status)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.625rem',
                      borderRadius: '0.375rem',
                      background: statusStyle.bg,
                      border: `1px solid ${statusStyle.borderColor}`,
                      fontSize: '0.75rem',
                      color: statusStyle.color,
                      cursor: 'help',
                    }}
                  >
                    <StatusIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                    <span style={{ fontWeight: 500 }}>{status.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 600, opacity: 0.8 }}>({count})</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Files Roster / Loading / Empty */}
          {filesLoading ? (
            <FileRosterSkeleton rows={8} />
          ) : visibleFiles.length === 0 && visibleFolders.length === 0 ? (
            <EmptyState
              type={searchQuery || filters.length > 0 ? 'no-results' : activeSpace === 'trash' ? 'trash-empty' : activeSpace === 'shared' ? 'shared-empty' : 'no-files'}
              onUpload={handleUpload}
              onCreateFolder={() => setCreateFolderModalOpen(true)}
            />
          ) : (
            <FileRoster
              files={visibleFiles}
              folders={visibleFolders}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onFileOpen={handleFileOpen}
              onFolderOpen={handleFolderOpen}
              onFileAction={handleFileAction}
              onFolderAction={handleFolderAction}
              onStarFile={handleStar}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isTrashView={activeSpace === 'trash'}
              currentUserEmail={user?.email}
              onEmptyTrash={handleEmptyTrash}
            />
          )}
        </main>
      </div>

      {/* Inbox Drawer */}
      {inboxOpen && (
        <InboxDrawer
          tasks={workflowTasks}
          onApprove={approveTask}
          onReject={rejectTask}
          onClose={() => setInboxOpen(false)}
        />
      )}

      {/* Custom Workflow Dialog */}
      <CustomWorkflowDialog
        isOpen={showWorkflowDialog}
        onClose={() => {
          setShowWorkflowDialog(false);
          setSelectedFileForWorkflow(null);
        }}
        file={selectedFileForWorkflow}
        onSubmit={handleWorkflowSubmit}
      />

      {/* File Details Modal */}
      {detailsModalFile && (
        <FileDetailsModal
          file={detailsModalFile}
          initialTab={detailsModalInitialTab || 'details'}
          userCanEdit={detailsModalFile?.owner?.keycloakId === user?.id}
          onClose={() => {
            setDetailsModalFile(null);
            setDetailsModalInitialTab(null);
          }}
          onDownload={downloadFile}
          onShare={handleShare}
          onGenerateLink={handleGeneratePublicLink}
          onStar={starFile}
          onTrash={trashFile}
          onRefresh={refreshFiles}
        />
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          uploads={uploads}
          uploading={uploading}
          onAddFiles={handleAddFilesToQueue}
          onRemove={removeUpload}
          onStart={handleStartUpload}
          onClose={() => {
            if (!uploading) {
              clearCompleted();
              setUploadModalOpen(false);
            }
          }}
        />
      )}

      {/* Rename Dialog */}
      {renameTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setRenameTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--panel, white)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '420px',
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)' }}>
              {t('drive.rename') || 'Rename'}
            </h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only alphanumeric, spaces, dots, hyphens, underscores
                const validChars = /^[a-zA-Z0-9\s._-]*$/;
                if (validChars.test(value) && value.length <= 255) {
                  setNewName(value);
                  setRenameError('');
                } else if (value.length > 255) {
                  setRenameError('Name must be 255 characters or less');
                } else {
                  setRenameError('Only letters, numbers, spaces, dots, hyphens, and underscores allowed');
                }
              }}
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && newName && !renameError) {
                  const isFolder = renameTarget.path !== undefined;
                  // For files, append the original extension
                  const finalName = isFolder ? newName : `${newName}.${renameTarget.name.split('.').pop()}`;
                  const result = isFolder
                    ? await renameFolder(renameTarget.id, finalName)
                    : await renameFile(renameTarget.id, finalName);
                  if (result.success) success(t('drive.renamed'));
                  else error(t('drive.renameFailed'));
                  setRenameTarget(null);
                  setRenameError('');
                } else if (e.key === 'Escape') {
                  setRenameTarget(null);
                  setRenameError('');
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                background: 'var(--panel, white)',
                color: 'var(--text, #111827)',
                outline: 'none',
                marginBottom: '1rem',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-alpha, rgba(37,99,235,0.2))';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #d1d5db)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {renameError && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#dc2626' }}>
                {renameError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setRenameTarget(null)}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={async () => {
                  if (newName && !renameError) {
                    const isFolder = renameTarget.path !== undefined;
                    // For files, append the original extension
                    const finalName = isFolder ? newName : `${newName}.${renameTarget.name.split('.').pop()}`;
                    const result = isFolder
                      ? await renameFolder(renameTarget.id, finalName)
                      : await renameFile(renameTarget.id, finalName);
                    if (result.success) success(t('drive.renamed'));
                    else error(t('drive.renameFailed'));
                  }
                  setRenameTarget(null);
                  setRenameError('');
                }}
                disabled={!newName || !!renameError}
              >
                {t('drive.rename') || 'Rename'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {createFolderModalOpen && (
        <CreateFolderModal
          parentFolderId={activeSpace === 'my-drive' ? currentFolderId : null}
          onCreate={handleCreateFolder}
          onClose={() => setCreateFolderModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--panel, white)',
              borderRadius: '1rem',
              padding: '1.75rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V12M12 15H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text, #111827)',
              }}
            >
              {t('drive.deleteConfirm') || 'Move to Trash?'}
            </h2>
            <p
              style={{
                margin: '0 0 1.75rem 0',
                fontSize: '0.9375rem',
                color: 'var(--text-muted, #6b7280)',
                lineHeight: '1.6',
              }}
            >
              {itemsToDelete.length === 1
                ? (t('drive.deleteConfirmMessageSingle') || 'This item will be moved to trash. You can restore it from the trash later.')
                : (t('drive.deleteConfirmMessageMultiple') || 'These items will be moved to trash. You can restore them from the trash later.')}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setItemsToDelete([]);
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '0.625rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text, #111827)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--background-secondary, #f9fafb)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {t('drive.moveToTrash') || 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {emptyTrashConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEmptyTrashConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--panel, white)',
              borderRadius: '1rem',
              padding: '1.75rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V12M12 15H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text, #111827)',
              }}
            >
              {t('drive.emptyTrashConfirm') || 'Empty Trash?'}
            </h2>
            <p
              style={{
                margin: '0 0 1.75rem 0',
                fontSize: '0.9375rem',
                color: 'var(--text-muted, #6b7280)',
                lineHeight: '1.6',
              }}
            >
              {t('drive.emptyTrashConfirmMessage') || 'This will permanently delete all items in the trash. This action cannot be undone.'}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setEmptyTrashConfirmOpen(false)}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '0.625rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text, #111827)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--background-secondary, #f9fafb)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={confirmEmptyTrash}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  borderRadius: '0.625rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {t('drive.emptyTrash') || 'Empty Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </div>
  );
}
