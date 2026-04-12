import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Folder, RefreshCw, Download, Trash2, Share2 } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useNotifications } from '@hooks/useNotifications';
import {
  listPersonalDriveFiles,
  deletePersonalDriveFile,
  downloadPersonalDriveFile,
  sharePersonalDriveFile
} from '@services/business/personalDriveService';
import NextcloudFileUpload from '@components/workflow/NextcloudFileUpload';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, SimpleLoading, EmptyState } from '@ui';

const WorkflowWorkspacePage = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const { triggerNotification } = useNotifications();

  const [folder, setFolder] = useState('Uploads');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [shareUserIds, setShareUserIds] = useState('');

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listPersonalDriveFiles(folder);
      if (result.success) {
        setFiles(result.data?.files || []);
      } else {
        triggerNotification('error', result.error || t('workflow.workspace.listError', 'Failed to load workspace files'));
        setFiles([]);
      }
    } catch (error) {
      triggerNotification('error', error.message || t('workflow.workspace.listError', 'Failed to load workspace files'));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [folder, triggerNotification, t]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) => (file.name || '').toLowerCase().includes(q));
  }, [files, search]);

  const handleDelete = useCallback(async (filePath) => {
    const result = await deletePersonalDriveFile(filePath);
    if (result.success) {
      triggerNotification('success', t('workflow.workspace.deleteSuccess', 'File deleted'));
      loadFiles();
    } else {
      triggerNotification('error', result.error || t('workflow.workspace.deleteError', 'Failed to delete file'));
    }
  }, [loadFiles, t, triggerNotification]);

  const handleDownload = useCallback(async (filePath) => {
    const result = await downloadPersonalDriveFile(filePath);
    if (!result.success) {
      triggerNotification('error', result.error || t('workflow.workspace.downloadError', 'Failed to download file'));
    }
  }, [t, triggerNotification]);

  const handleShare = useCallback(async (filePath) => {
    const userIds = shareUserIds
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (userIds.length === 0) {
      triggerNotification('warning', t('workflow.workspace.shareUsersRequired', 'Enter one or more recipient user IDs'));
      return;
    }

    const result = await sharePersonalDriveFile(filePath, userIds, { permissions: 'read' });
    if (result.success) {
      triggerNotification('success', t('workflow.workspace.shareSuccess', 'File shared successfully'));
    } else {
      triggerNotification('error', result.error || t('workflow.workspace.shareError', 'Failed to share file'));
    }
  }, [shareUserIds, t, triggerNotification]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/workflow/inbox')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('workflow.workspace.back', 'Back to Inbox')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('workflow.workspace.title', 'Personal Drive Workspace')}</h1>
            <p className="text-gray-600">{t('workflow.workspace.subtitle', 'Manage your private drive files used in workflow')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadFiles} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('workflow.workspace.refresh', 'Refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('workflow.workspace.upload', 'Upload to Workspace')}</CardTitle>
        </CardHeader>
        <CardContent>
          <NextcloudFileUpload onFileUploaded={loadFiles} onError={(msg) => triggerNotification('error', msg)} maxSize={50 * 1024 * 1024} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('workflow.workspace.filters', 'Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.workspace.folder', 'Folder')}</label>
              <Input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Uploads" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.workspace.search', 'Search')}</label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('workflow.workspace.searchPlaceholder', 'Search files...')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.workspace.shareUserIds', 'Share User IDs')}</label>
              <Input value={shareUserIds} onChange={(e) => setShareUserIds(e.target.value)} placeholder={t('workflow.workspace.shareUserIdsPlaceholder', 'e.g. 2,7,15')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('workflow.workspace.files', 'Files')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <SimpleLoading />
            </div>
          ) : filteredFiles.length === 0 ? (
            <EmptyState
              icon={<Folder className="h-12 w-12 text-gray-400" />}
              title={t('workflow.workspace.empty', 'No files found')}
              description={t('workflow.workspace.emptyDescription', 'Upload files or change folder/filter to see results')}
            />
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div key={file.path} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{file.name || file.path}</div>
                    <div className="text-xs text-gray-500 truncate">{file.path}</div>
                    <div className="text-xs text-gray-500">
                      {file.isFolder ? t('workflow.workspace.folderType', 'Folder') : `${Math.round((file.size || 0) / 1024)} KB`} · {file.lastModified || '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={file.isFolder ? 'outline' : 'secondary'}>
                      {file.isFolder ? t('workflow.workspace.folder', 'Folder') : t('workflow.workspace.file', 'File')}
                    </Badge>
                    {!file.isFolder && (
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(file.path)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {!file.isFolder && (
                      <Button variant="ghost" size="sm" onClick={() => handleShare(file.path)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(file.path)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowWorkspacePage;
