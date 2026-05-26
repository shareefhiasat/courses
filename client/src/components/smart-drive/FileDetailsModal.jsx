import { useState, useRef, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { getIcon } from '@constants/iconTypes';
import Modal from '@ui/Modal/Modal';
import Button from '@ui/Button/Button';
import Tabs from '@ui/Tabs/Tabs';
import DetailsTab from './tabs/DetailsTab';
import VersionsTab from './tabs/VersionsTab';
import CommentsTab from './tabs/CommentsTab';
import ActivityTab from './tabs/ActivityTab';
import WorkflowTab from './tabs/WorkflowTab';
import ShareTab from './tabs/ShareTab';

export default function FileDetailsModal({ file, onClose, onDownload, onShare, onGenerateLink, onStar, onTrash, onRefresh, initialTab = 'details', userCanEdit = false }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [previewOpened, setPreviewOpened] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewMode, setPreviewMode] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [wopiToken, setWopiToken] = useState(null);
  const [editWopiToken, setEditWopiToken] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentFile, setCurrentFile] = useState(file);
  const previewContainerRef = useRef(null);
  const iframeRef = useRef(null);

  const getFileType = (file) => {
    if (!file || !file.mimeType) return 'unknown';
    const mt = file.mimeType.toLowerCase();
    const name = (file.name || '').toLowerCase();

    if (mt.startsWith('image/')) return 'image';
    if (mt.startsWith('video/')) return 'video';
    if (mt.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
    if (mt.includes('word') || mt.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
    if (mt.includes('presentation') || mt.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'presentation';
    if (mt.includes('sheet') || mt.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'spreadsheet';
    return 'unknown';
  };

  const fileType = getFileType(currentFile);
  const isPreviewable = ['image', 'video', 'pdf', 'document', 'presentation', 'spreadsheet'].includes(fileType);
  const isCollaboraFile = ['document', 'presentation', 'spreadsheet'].includes(fileType);
  const canShowEditTab = isCollaboraFile && userCanEdit;

  // Update current file when file prop changes
  useEffect(() => {
    setCurrentFile(file);
  }, [file]);

  // Listen for version update events
  useEffect(() => {
    const handleVersionUpdate = (event) => {
      if (event.detail?.fileId === currentFile?.id) {
        console.log('[FileDetailsModal] Version update detected, refreshing file data');
        // Trigger parent refresh
        if (onRefresh) {
          onRefresh();
        }
        // Refetch preview URL to show latest version
        if (isPreviewable) {
          fetchPreviewUrl();
        }
      }
    };

    window.addEventListener('file-version-updated', handleVersionUpdate);
    return () => window.removeEventListener('file-version-updated', handleVersionUpdate);
  }, [currentFile?.id, isPreviewable, onRefresh]);

  // Fetch preview URL when modal opens or file changes
  useEffect(() => {
    if (currentFile && isPreviewable) {
      fetchPreviewUrl();
    }
  }, [currentFile, isPreviewable]);

  // Fetch edit token when edit tab is activated
  useEffect(() => {
    if (currentFile && activeTab === 'edit' && canShowEditTab && !editWopiToken) {
      fetchEditToken();
    }
  }, [activeTab, currentFile, canShowEditTab, editWopiToken]);

  const fetchPreviewUrl = async () => {
    if (!currentFile) return;

    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/v1/drive/files/${currentFile.id}/preview`);
      const data = await response.json();
      
      if (data.success) {
        setPreviewUrl(data.payload.url);
        setPreviewMode(data.payload.mode);
        setWopiToken(data.payload.wopiToken);
        console.log('[FileDetailsModal] Preview mode set to:', data.payload.mode);
        setPreviewOpened(true);
      } else {
        console.error('[FileDetailsModal] Failed to get preview URL:', data.error);
        // Handle FILE_NOT_READY error specifically
        if (data.error?.code === 'FILE_NOT_READY') {
          setPreviewMode('not_ready');
        } else {
          setPreviewMode('download');
        }
      }
    } catch (error) {
      console.error('[FileDetailsModal] Error fetching preview URL:', error);
      setPreviewMode('download');
    } finally {
      setPreviewLoading(false);
    }
  };

  const fetchEditToken = async () => {
    if (!currentFile) return;

    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/v1/drive/files/${currentFile.id}/collabora/edit`);
      const data = await response.json();
      
      if (data.success) {
        setEditWopiToken(data.payload.wopiToken);
        console.log('[FileDetailsModal] Edit token fetched');
      } else {
        console.error('[FileDetailsModal] Failed to get edit token:', data.error);
      }
    } catch (error) {
      console.error('[FileDetailsModal] Error fetching edit token:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Log activity when preview is opened
  useEffect(() => {
    if (previewOpened && activeTab === 'preview') {
      const logActivity = async () => {
        try {
          const token = localStorage.getItem('keycloak_token');
          await fetch(`/api/v1/drive/files/${file.id}/activity`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: 'preview' })
          });
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      };
      logActivity();
    }
  }, [previewOpened, activeTab, file?.id]);

  const toggleFullscreen = () => {
    if (!previewContainerRef.current) return;
    
    if (!isFullscreen) {
      if (previewContainerRef.current.requestFullscreen) {
        previewContainerRef.current.requestFullscreen();
      } else if (previewContainerRef.current.webkitRequestFullscreen) {
        previewContainerRef.current.webkitRequestFullscreen();
      } else if (previewContainerRef.current.msRequestFullscreen) {
        previewContainerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const tabs = [
    ...(isPreviewable ? [{ value: 'preview', label: t('drive.preview'), icon: getIcon('ui', 'eye') }] : []),
    ...(canShowEditTab ? [{ value: 'edit', label: t('drive.edit'), icon: getIcon('ui', 'edit') }] : []),
    { value: 'details', label: t('drive.details'), icon: getIcon('ui', 'info') },
    { value: 'versions', label: t('drive.versions'), icon: getIcon('ui', 'clock') },
    { value: 'comments', label: t('drive.comments'), icon: getIcon('ui', 'message') },
    { value: 'activity', label: t('drive.activity'), icon: getIcon('ui', 'activity') },
    { value: 'workflow', label: t('drive.workflow'), icon: getIcon('ui', 'workflow', 16, '#8b5cf6') },
    { value: 'share', label: t('drive.share'), icon: getIcon('ui', 'share') },
  ];

  const footer = (
    <div className="flex items-center gap-3">
      {onDownload && (
        <Button variant="primary" onClick={() => onDownload(file.id)}>
          {t('drive.download')}
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={file.name}
      size="large"
      showCloseButton={true}
      closeOnEscape={false}
      footer={footer}
      titleStyle={{ fontSize: '1.25rem', fontWeight: '600' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          size="md"
        />
        {(activeTab === 'preview' || activeTab === 'edit') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {file.currentVersion?.versionNumber && (
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                background: '#e5e7eb',
                color: '#6b7280',
              }}>
                v{file.currentVersion.versionNumber}
              </span>
            )}
            {activeTab === 'preview' && previewMode === 'collabora' && wopiToken && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const collaboraUrl = `https://localhost:9980/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent('http://host.docker.internal:8001/api/v1/wopi/files/' + file.id)}&access_token=${wopiToken}`;
                    window.open(collaboraUrl, '_blank', 'noopener,noreferrer');
                    // Log activity
                    try {
                      await fetch(`/api/v1/drive/files/${file.id}/activity`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'open_in_new_tab' })
                      });
                    } catch (error) {
                      console.error('Failed to log activity:', error);
                    }
                  }}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                  title={t('drive.openInNewTab') || 'Open in New Tab'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const iframe = previewContainerRef.current?.querySelector('iframe');
                    if (iframe) {
                      if (!document.fullscreenElement) {
                        if (iframe.requestFullscreen) {
                          iframe.requestFullscreen();
                        } else if (iframe.webkitRequestFullscreen) {
                          iframe.webkitRequestFullscreen();
                        } else if (iframe.msRequestFullscreen) {
                          iframe.msRequestFullscreen();
                        }
                      } else {
                        if (document.exitFullscreen) {
                          document.exitFullscreen();
                        } else if (document.webkitExitFullscreen) {
                          document.webkitExitFullscreen();
                        } else if (document.msExitFullscreen) {
                          document.msExitFullscreen();
                        }
                      }
                    }
                  }}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                  title={t('drive.fullscreen') || 'Fullscreen'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                  </svg>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          minHeight: 'min(70vh, 600px)',
          overflowY: 'auto',
        }}
      >
        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            {previewLoading && (
              <div style={{ padding: '2rem', color: 'var(--text-muted, #6b7280)' }}>
                Loading preview...
              </div>
            )}
            {!previewLoading && previewMode === 'inline' && previewUrl && (
              <>
                {fileType === 'image' && (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                  />
                )}
                {fileType === 'video' && (
                  <video
                    src={previewUrl}
                    controls
                    style={{ maxWidth: '100%', maxHeight: '600px' }}
                  >
                    Your browser does not support video playback.
                  </video>
                )}
                {fileType === 'pdf' && (
                  <div style={{ position: 'relative', width: '100%', height: '600px' }}>
                    <button
                      onClick={toggleFullscreen}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 10,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                      {isFullscreen ? getIcon('ui', 'minimize', 20) : getIcon('ui', 'maximize', 20)}
                    </button>
                    <iframe
                      ref={previewContainerRef}
                      src={previewUrl}
                      style={{ width: '100%', height: '600px', border: 'none' }}
                      title={file.name}
                    />
                  </div>
                )}
              </>
            )}
            {!previewLoading && previewMode === 'collabora' && wopiToken && (
              <div ref={previewContainerRef} style={{ width: '100%' }}>
                <iframe
                  ref={iframeRef}
                  src={`https://localhost:9980/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent('http://host.docker.internal:8001/api/v1/wopi/files/' + file.id)}&access_token=${wopiToken}`}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title={file.name}
                />
              </div>
            )}
            {!previewLoading && previewMode === 'download' && (
              <div style={{ padding: '2rem', color: 'var(--text-muted, #6b7280)', textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem' }}>Preview not available for this file type. Please download to view.</p>
                {onDownload && (
                  <Button variant="primary" onClick={() => onDownload(file.id)}>
                    {t('drive.download')}
                  </Button>
                )}
              </div>
            )}
            {!previewLoading && previewMode === 'not_ready' && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #6b7280)' }}>
                <p style={{ marginBottom: '1rem' }}>
                  File upload was not completed. Please delete and re-upload this file.
                </p>
                {onDownload && (
                  <Button variant="primary" onClick={() => onDownload(file.id)}>
                    {t('drive.download')}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            {previewLoading && (
              <div style={{ padding: '2rem', color: 'var(--text-muted, #6b7280)' }}>
                Loading editor...
              </div>
            )}
            {!previewLoading && editWopiToken && (
              <div ref={previewContainerRef} style={{ width: '100%' }}>
                <iframe
                  ref={iframeRef}
                  src={`https://localhost:9980/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent('http://host.docker.internal:8001/api/v1/wopi/files/' + file.id)}&access_token=${editWopiToken}`}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title={file.name}
                />
              </div>
            )}
            {!previewLoading && !editWopiToken && (
              <div style={{ padding: '2rem', color: 'var(--text-muted, #6b7280)', textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem' }}>Failed to load editor. Please try again.</p>
                <Button variant="secondary" onClick={fetchEditToken}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'details' && <DetailsTab file={file} />}
        {activeTab === 'versions' && <VersionsTab fileId={file.id} />}
        {activeTab === 'comments' && <CommentsTab fileId={file.id} />}
        {activeTab === 'activity' && <ActivityTab fileId={file.id} />}
        {activeTab === 'workflow' && <WorkflowTab fileId={file.id} />}
        {activeTab === 'share' && <ShareTab fileId={file.id} onShare={onShare} onGenerateLink={onGenerateLink} />}
      </div>
    </Modal>
  );
}
