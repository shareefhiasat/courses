import React, { useState, useCallback, useEffect } from 'react';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, Trash2, RefreshCw, FolderOpen, Users, GitBranch } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  getPrivateFiles,
  uploadFilePrivate,
  deleteFilePrivate
} from '../services/business/driveService';
import { createCustomWorkflow } from '../services/business/workflowDocumentService';
import CustomWorkflowDialog from '../components/workflow/CustomWorkflowDialog.jsx';
import { info, error as logError } from '../services/utils/logger';

/**
 * Drive Page - Private and Shared Spaces
 * UI component for browsing and managing files in private and shared spaces
 */
export default function DrivePage() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [privateFiles, setPrivateFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('private');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [selectedFileForWorkflow, setSelectedFileForWorkflow] = useState(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'private') {
        const result = await getPrivateFiles(user?.keycloakId);
        if (result.success) {
          setPrivateFiles(result.data || []);
        } else {
          setError(result.error || 'Failed to load private files');
        }
      } else {
        // Shared files not implemented yet
        setSharedFiles([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.keycloakId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadProgress(10);

    try {
      const result = await uploadFilePrivate(user?.keycloakId, selectedFile);

      if (result.success) {
        setUploadProgress(100);
        setSelectedFile(null);
        await loadFiles();
        setTimeout(() => setUploadProgress(0), 1000);
      } else {
        setError(result.error || 'Upload failed');
        setUploadProgress(0);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploadProgress(0);
    }
  }, [selectedFile, user?.keycloakId, loadFiles]);

  const handleDelete = useCallback(async (filePath) => {
    if (!confirm(t('drive.confirm_delete', 'Are you sure you want to delete this file?'))) {
      return;
    }

    try {
      // Extract filename from path (last segment)
      const fileName = filePath?.split('/').pop() || filePath;
      const result = await deleteFilePrivate(user?.keycloakId, fileName);
      if (result.success) {
        await loadFiles();
      } else {
        setError(result.error || 'Delete failed');
      }
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  }, [loadFiles, t, user?.keycloakId]);

  const handleCreateWorkflow = useCallback((file) => {
    setSelectedFileForWorkflow(file);
    setShowWorkflowDialog(true);
  }, []);

  const handleWorkflowSubmit = useCallback(async (workflowData) => {
    info('[DrivePage] Workflow submit initiated', {
      hasFile: !!selectedFileForWorkflow,
      fileName: selectedFileForWorkflow?.name
    });

    try {
      const result = await createCustomWorkflow(selectedFileForWorkflow, workflowData);

      if (result.success) {
        info('[DrivePage] Workflow created successfully', {
          documentId: result.data?.document?.id
        });
        
        alert(t('drive.workflowCreated', 'Workflow created successfully'));
        setShowWorkflowDialog(false);
        setSelectedFileForWorkflow(null);
        
        // Navigate to workflow document detail page
        navigate(`/workflow-documents/${result.data.document.id}`);
      } else {
        logError('[DrivePage] Workflow creation failed', {
          error: result.error
        });
        alert(result.error || t('drive.workflowCreationFailed', 'Failed to create workflow'));
      }
    } catch (err) {
      logError('[DrivePage] Error creating workflow', {
        error: err.message,
        stack: err.stack
      });
      alert(t('drive.workflowCreationError', 'Error creating workflow'));
    }
  }, [t, selectedFileForWorkflow, navigate]);

  const handleRefresh = useCallback(() => {
    loadFiles();
  }, [loadFiles]);

  // Check if user has access to drive (after all hooks are called)
  const hasAccess = user?.roles?.includes('admin') || user?.roles?.includes('hr') || user?.roles?.includes('instructor');
  
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  const currentFiles = activeTab === 'private' ? privateFiles : sharedFiles;

  // Update file display to use path instead of ID
  const displayedFiles = currentFiles.map(file => ({
    ...file,
    id: file.path || file.name,
    name: file.name || file.path?.split('/').pop()
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('drive.title', 'Drive')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('drive.description', 'Manage your files in private and shared spaces')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => navigate('/smart-drive')}
          className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'private'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          {t('drive.private_tab', 'Private Space')}
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'shared'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          {t('drive.shared_tab', 'Shared Space')}
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <input
            type="file"
            onChange={handleFileSelect}
            className="flex-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900/20 dark:file:text-blue-400
              dark:hover:file:bg-blue-900/30"
          />
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Files List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeTab === 'private'
              ? t('drive.private_files', 'Private Files')
              : t('drive.shared_files', 'Shared Files')}
          </h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && currentFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            {t('drive.loading', 'Loading files...')}
          </div>
        ) : displayedFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            {t('drive.no_files', 'No files found')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayedFiles.map((file) => (
              <div key={file.path || file.name} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {file.size && `${(file.size / 1024).toFixed(2)} KB`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.roles?.includes('instructor') || user?.roles?.includes('hr') || user?.roles?.includes('admin') || user?.roles?.includes('super_admin') ? (
                    <button
                      onClick={() => handleCreateWorkflow(file)}
                      className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                      title={t('drive.actions.createWorkflow', 'Create Workflow')}
                    >
                      <GitBranch className="w-4 h-4" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => handleDelete(file.path || file.filePath)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
