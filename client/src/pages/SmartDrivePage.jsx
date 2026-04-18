import { useState, useRef, useEffect } from 'react';
import { 
  FolderLock, Users, Workflow, Upload, Plus, 
  Grid, List, Search, Filter, MoreVertical, 
  Download, Share2, Trash2, Eye, X, FileText, 
  Image, Film, Music, Archive, File, Play,
  Folder, Star, Clock, FolderPlus, UploadCloud,
  Bell, Settings, Table
} from 'lucide-react';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { useDriveMinIO } from '@hooks/useDriveMinIO';
import { ROLE_STRINGS } from '@utils/userUtils';
import UploadZone from '@components/smart-drive/UploadZone';
import ShareDialog from '@components/smart-drive/ShareDialog';
import DriveSidebar from '@components/smart-drive/DriveSidebar';

// Workflow states
const WORKFLOW_STATES = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

/**
 * SmartDrivePage - Professional MinIO-based file management with sidebar (Figma Dark Theme)
 * Features: Dark theme, sidebar navigation, grid/list views, file preview, context menu, workflow status
 */
export default function SmartDrivePage() {
  const { t } = useLang();
  const { hasPermission, roleCode } = usePermissions();
  const {
    privateFiles,
    sharedFiles,
    workflowFiles,
    loading,
    error,
    fileCounts,
    uploadFile,
    deleteFile,
    shareFile,
    generatePublicLink,
    storageUsage,
    storageLimit,
    updateFile,
  } = useDriveMinIO();

  const [activeSpace, setActiveSpace] = useState('my-drive');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenuFile, setContextMenuFile] = useState(null);
  const contextMenuRef = useRef(null);

  // Super admin bypass
  const isSuperAdmin = roleCode === ROLE_STRINGS.SUPER_ADMIN;

  // Permission checks
  const canViewPrivate = isSuperAdmin || hasPermission('drive.private');
  const canViewShared = isSuperAdmin || hasPermission('drive.shared');
  const canViewWorkflow = isSuperAdmin || hasPermission('drive.workflow');
  const canUpload = isSuperAdmin || hasPermission('drive.upload');
  const canDownload = isSuperAdmin || hasPermission('drive.download');
  const canDelete = isSuperAdmin || hasPermission('drive.delete');

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenuFile(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current bucket and files based on active space
  const getCurrentBucket = () => {
    const spaceBucketMap = { 
      'private': 'lms-private', 
      'shared-space': 'lms-shared', 
      'workflow': 'lms-workflow',
      'my-drive': 'all',
      'shared': 'all',
      'trash': 'all'
    };
    return spaceBucketMap[activeSpace] || 'lms-private';
  };

  const getCurrentFiles = () => {
    let files = [];
    
    // Map space to files
    switch (activeSpace) {
      case 'private':
        files = privateFiles;
        break;
      case 'shared-space':
        files = sharedFiles;
        break;
      case 'workflow':
        files = workflowFiles;
        break;
      case 'my-drive':
        files = [...privateFiles, ...sharedFiles, ...workflowFiles];
        break;
      case 'shared':
        files = sharedFiles; // For now, same as shared-space
        break;
      case 'trash':
        files = []; // Future: soft-deleted files
        break;
      default:
        files = privateFiles;
    }
    
    // Filter by search query
    if (searchQuery) {
      files = files.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return files;
  };

  // File icon helper
  const getFileIcon = (file, size = 'w-8 h-8') => {
    const iconClass = size;
    if (!file.mimeType) return <File className={`${iconClass} text-gray-400`} />;
    if (file.mimeType.startsWith('image/')) return <Image className={`${iconClass} text-blue-500`} />;
    if (file.mimeType.startsWith('video/')) return <Film className={`${iconClass} text-purple-500`} />;
    if (file.mimeType.startsWith('audio/')) return <Music className={`${iconClass} text-pink-500`} />;
    if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) return <Archive className={`${iconClass} text-yellow-500`} />;
    return <FileText className={`${iconClass} text-gray-500`} />;
  };

  // Format helpers
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  // Handlers
  const handleUpload = async (file, onProgress) => {
    await uploadFile(file, getCurrentBucket(), {}, onProgress);
  };

  const handleDownload = async (file) => {
    console.log('[SmartDrive] handleDownload called for file:', file.name, 's3Key:', file.s3Key);
    if (!canDownload) {
      console.log('[SmartDrive] Download permission denied');
      return;
    }
    const downloadUrl = `${import.meta.env.VITE_API_URL}/drive/files/${encodeURIComponent(file.s3Key)}/download`;
    console.log('[SmartDrive] Download URL:', downloadUrl);
    window.open(downloadUrl, '_blank');
  };

  const handleDelete = async (file) => {
    console.log('[SmartDrive] handleDelete called for file:', file.name, 'id:', file.id);
    if (!canDelete) {
      console.log('[SmartDrive] Delete permission denied');
      return;
    }
    if (confirm(t('drive.confirmDelete'))) {
      const bucket = getCurrentBucket();
      console.log('[SmartDrive] Deleting file from bucket:', bucket);
      await deleteFile(file.id, bucket);
      setContextMenuFile(null);
    }
  };

  const handleShare = (file) => {
    console.log('[SmartDrive] handleShare called for file:', file.name);
    setSelectedFile(file);
    setShowShareDialog(true);
    setContextMenuFile(null);
  };

  const handlePreview = (file) => {
    console.log('[SmartDrive] handlePreview called for file:', file.name, 'mimeType:', file.mimeType);
    setSelectedFile(file);
    setShowPreview(true);
    setContextMenuFile(null);
  };

  const handleStartWorkflow = async (file) => {
    console.log('[SmartDrive] handleStartWorkflow called for file:', file.name);
    try {
      await updateFile(file.id, { workflowStatus: WORKFLOW_STATES.DRAFT });
      setContextMenuFile(null);
      // Refresh files to show updated status
      // In a real implementation, you'd call refresh functions here
    } catch (error) {
      console.error('[SmartDrive] Error starting workflow:', error);
    }
  };

  const handleWorkflowTransition = async (file, newStatus) => {
    console.log('[SmartDrive] handleWorkflowTransition called for file:', file.name, 'newStatus:', newStatus);
    try {
      await updateFile(file.id, { workflowStatus: newStatus });
      setContextMenuFile(null);
    } catch (error) {
      console.error('[SmartDrive] Error transitioning workflow:', error);
    }
  };

  const currentFiles = getCurrentFiles();

  console.log('[SmartDrive] Rendering with currentFiles:', currentFiles.length);
  if (currentFiles.length > 0) {
    console.log('[SmartDrive] First file structure:', currentFiles[0]);
  }

  return (
    <div className="flex h-screen bg-[#11131b] text-[#e1e2ed] antialiased selection:bg-[#2563eb] selection:text-white">
      {/* Sidebar */}
      <DriveSidebar 
        activeSpace={activeSpace} 
        setActiveSpace={setActiveSpace}
        storageUsage={storageUsage}
        storageLimit={storageLimit}
      />

      {/* Main Content */}
      <main className="ms-64 min-h-screen flex flex-col bg-[#11131b] overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 w-full z-40 bg-[#11131b]/80 backdrop-blur-md flex items-center justify-between px-8 py-4 font-['Inter'] font-medium text-sm tracking-tight shadow-xl shadow-black/20">
          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d90a0] group-focus-within:text-[#b4c5ff] transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder={t('drive.searchFiles')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0c0e16] border border-[#434655]/30 rounded-full py-2.5 pl-12 pr-4 text-[#e1e2ed] focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all placeholder:text-[#8d90a0]/50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 ms-8">
            <div className="flex items-center gap-2 border-r border-[#434655]/30 pe-6 me-2">
              {canUpload && (
                <>
                  <button className="px-4 py-2 text-slate-400 hover:text-white hover:bg-[#32343d] rounded-xl transition-all active:opacity-80 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    New file
                  </button>
                  <button className="px-4 py-2 text-slate-400 hover:text-white hover:bg-[#32343d] rounded-xl transition-all active:opacity-80 flex items-center gap-2">
                    <FolderPlus className="w-5 h-5" />
                    Create folder
                  </button>
                  <button className="px-4 py-2 text-slate-400 hover:text-white hover:bg-[#32343d] rounded-xl transition-all active:opacity-80 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5" />
                    Request
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ffb4ab] rounded-full border-2 border-[#11131b]"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-[#32343d] border border-[#434655]/30 overflow-hidden cursor-pointer hover:border-[#2563eb] transition-all">
                <div className="w-full h-full bg-[#2563eb] flex items-center justify-center text-white text-xs font-bold">
                  {roleCode?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-12 overflow-auto flex-1">
          {/* Error */}
          {error && (
            <div className="mb-4 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded-lg p-3">
              <p className="text-sm text-[#ffb4ab]">{error}</p>
            </div>
          )}

          {/* Upload Zone */}
          {showUpload && (
            <div className="mb-6">
              <UploadZone
                bucket={getCurrentBucket()}
                onUpload={handleUpload}
                onClose={() => setShowUpload(false)}
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2563eb] border-t-transparent"></div>
              <p className="mt-3 text-sm text-[#8d90a0]">{t('drive.loading')}</p>
            </div>
          )}

          {/* Recently Used Section */}
          {!loading && currentFiles.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Recently used
                  <span className="text-xs font-medium text-[#b4c5ff] px-2 py-0.5 bg-[#2563eb]/10 rounded-full">
                    {currentFiles.length} Assets
                  </span>
                </h2>
                <button className="text-xs font-bold uppercase tracking-widest text-[#8d90a0] hover:text-[#b4c5ff] transition-colors">
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {currentFiles.slice(0, 5).map(file => (
                  <div
                    key={file.id}
                    className="group bg-[#191b23] rounded-2xl p-4 border border-transparent hover:bg-[#1d1f27] hover:border-[#2563eb]/20 transition-all duration-200 cursor-pointer"
                    onClick={() => handlePreview(file)}
                  >
                    {/* File Preview */}
                    <div className="aspect-video bg-[#1d1f27] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                      {file.mimeType?.startsWith('image/') ? (
                        <img 
                          src={file.previewUrl} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-[#b4c5ff]/40">{getFileIcon(file, 'w-16 h-16')}</div>
                      )}
                      {file.mimeType && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded text-[10px] font-bold text-white">
                          {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      )}
                    </div>
                    {/* File Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-[#8d90a0] mt-1">
                          {formatDate(file.createdAt)} • {formatSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuFile(contextMenuFile === file.id ? null : file.id);
                        }}
                        className="text-[#8d90a0] group-hover:text-[#b4c5ff] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Files Table Section */}
          {!loading && currentFiles.length > 0 && (
            <section className="bg-[#191b23] rounded-[24px] overflow-hidden border border-[#434655]/10 shadow-2xl">
              <div className="px-8 py-6 border-b border-[#434655]/10 flex items-center justify-between bg-[#191b23]/50">
                <h2 className="text-xl font-bold tracking-tight text-white">All files</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-[#8d90a0] hover:text-white transition-colors bg-[#1d1f27] rounded-lg">
                    <Filter className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className="p-2 text-[#8d90a0] hover:text-white transition-colors bg-[#1d1f27] rounded-lg"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'text-[#b4c5ff] bg-[#2563eb]/10' : 'text-[#8d90a0] hover:text-white bg-[#1d1f27]'} transition-colors`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Table View */}
              {viewMode === 'list' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-widest text-[#8d90a0] bg-[#1d1f27]/30">
                        <th className="py-4 ps-8 pe-4 w-12">
                          <input type="checkbox" className="rounded border-[#434655] bg-[#1d1f27] text-[#2563eb] focus:ring-[#2563eb]" />
                        </th>
                        <th className="py-4 px-4">Name</th>
                        <th className="py-4 px-4">Last Modified</th>
                        <th className="py-4 px-4">Size</th>
                        <th className="py-4 px-4 pe-8 text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#434655]/10">
                      {currentFiles.map(file => (
                        <tr key={file.id} className="group hover:bg-[#1d1f27] transition-colors cursor-pointer">
                          <td className="py-4 ps-8 pe-4">
                            <input type="checkbox" className="rounded border-[#434655] bg-[#1d1f27] text-[#2563eb] focus:ring-[#2563eb]" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[#1d1f27] flex items-center justify-center text-[#b4c5ff] group-hover:scale-110 transition-transform">
                                {getFileIcon(file, 'w-5 h-5')}
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-white block">{file.name}</span>
                                {activeSpace === 'workflow' && file.workflowStatus && (
                                  <span className="text-[10px] font-bold uppercase tracking-tight text-[#8d90a0] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#b4c5ff]"></span>
                                    {file.workflowStatus}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs text-[#8d90a0]">{formatDate(file.createdAt)}</td>
                          <td className="py-4 px-4 text-xs text-[#8d90a0]">{formatSize(file.size)}</td>
                          <td className="py-4 px-4 pe-8">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canDownload && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                  className="p-1.5 text-[#8d90a0] hover:text-[#b4c5ff] transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleShare(file); }}
                                className="p-1.5 text-[#8d90a0] hover:text-[#b4c5ff] transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                  className="p-1.5 text-[#8d90a0] hover:text-white transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {currentFiles.map(file => (
                      <div
                        key={file.id}
                        className="group bg-[#1d1f27] rounded-xl p-4 border border-[#434655]/20 hover:border-[#2563eb]/30 transition-all cursor-pointer"
                        onClick={() => handlePreview(file)}
                      >
                        <div className="aspect-square bg-[#191b23] rounded-lg mb-3 flex items-center justify-center p-4">
                          {file.mimeType?.startsWith('image/') ? (
                            <img 
                              src={file.previewUrl} 
                              alt={file.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="text-[#b4c5ff]/40">{getFileIcon(file, 'w-12 h-12')}</div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-[#8d90a0] mt-1">{formatSize(file.size)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              <div className="px-8 py-4 bg-[#1d1f27]/30 border-t border-[#434655]/10 flex items-center justify-between">
                <p className="text-xs text-[#8d90a0]">Showing {currentFiles.length} of {currentFiles.length} assets</p>
                <div className="flex items-center gap-4">
                  <button className="text-xs font-bold text-[#8d90a0] hover:text-white transition-colors flex items-center gap-2">
                    Previous
                  </button>
                  <span className="w-6 h-6 rounded bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <button className="text-xs font-bold text-[#8d90a0] hover:text-white transition-colors flex items-center gap-2">
                    Next
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Empty State */}
          {!loading && currentFiles.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1d1f27] rounded-full mb-4">
                <Upload className="w-10 h-10 text-[#8d90a0]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {t('drive.noFiles')}
              </h3>
              <p className="text-sm text-[#8d90a0] mb-4">
                {t('drive.uploadFirstFile')}
              </p>
              {canUpload && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('drive.uploadFiles')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-[#2563eb] text-white rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center group active:scale-95 transition-all z-50"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
          </button>
        )}
      </main>

      {/* Share Dialog */}
      {showShareDialog && selectedFile && (
        <ShareDialog
          file={selectedFile}
          onShare={shareFile}
          onGenerateLink={generatePublicLink}
          onClose={() => {
            setShowShareDialog(false);
            setSelectedFile(null);
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full max-h-full bg-[#191b23] rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-[#1d1f27] hover:bg-[#32343d] text-[#e1e2ed] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {selectedFile.mimeType?.startsWith('image/') ? (
              <img
                src={selectedFile.previewUrl}
                alt={selectedFile.name}
                className="w-full h-full object-contain max-h-[85vh]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-16">
                <div className="mb-4 text-[#b4c5ff]/40">{getFileIcon(selectedFile, 'w-20 h-20')}</div>
                <h3 className="text-lg font-medium text-white mb-2">{selectedFile.name}</h3>
                <p className="text-sm text-[#8d90a0] mb-4">{formatSize(selectedFile.size)}</p>
                {canDownload && (
                  <button
                    onClick={() => handleDownload(selectedFile)}
                    className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 transition-colors"
                  >
                    {t('drive.download')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
