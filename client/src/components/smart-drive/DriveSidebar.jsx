import { CloudUpload, Upload, Folder, Image, Star, Clock, Share2, Trash2, X } from 'lucide-react';
import { useLang } from '@contexts/LangContext';

/**
 * DriveSidebar - Sidebar navigation for SmartDrive (Figma Dark Theme)
 * Features: Space navigation, pinned spaces, folders section, storage indicator
 */
export default function DriveSidebar({ 
  activeSpace, 
  setActiveSpace,
  storageUsage = 0, 
  storageLimit = 500 * 1024 * 1024,
  onUploadClick,
  folders = [],
  onFolderSelect,
  spaces = [],
  isSidebarOpen = false,
  onClose,
}) {
  const { t } = useLang();

  const storagePercentage = Math.min((storageUsage / storageLimit) * 100, 100);
  const storageUsedMB = (storageUsage / (1024 * 1024)).toFixed(1);
  const storageLimitMB = (storageLimit / (1024 * 1024)).toFixed(0);

  const iconMap = {
    'my-drive': Folder,
    photos: Image,
    starred: Star,
    recent: Clock,
    shared: Share2,
    trash: Trash2,
    workflow: Folder,
  };

  const defaultSpaces = [
    { id: 'my-drive', label: t('drive.myDrive') },
    { id: 'photos', label: t('drive.photos') },
    { id: 'starred', label: t('drive.starred') },
    { id: 'recent', label: t('drive.recent') },
    { id: 'shared', label: t('drive.sharedWithMe') },
    { id: 'workflow', label: t('drive.workflow') },
    { id: 'trash', label: t('drive.trash') },
  ];

  const resolvedSpaces = (spaces.length ? spaces : defaultSpaces).map((space) => ({
    ...space,
    icon: iconMap[space.id] || Folder,
  }));

  const sidebarStyle = {
    background: 'var(--panel, #191b23)',
    color: 'var(--text-primary, #e1e2ed)',
  };

  return (
    <aside
      className={`h-full w-64 fixed left-0 top-0 overflow-y-auto font-['Inter'] antialiased text-sm tracking-tight flex flex-col p-4 gap-2 z-50 transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={sidebarStyle}
    >
      {onClose && (
        <button
          type="button"
          className="lg:hidden absolute top-4 right-4 p-2 rounded-full bg-black/20"
          onClick={onClose}
          aria-label={t('close')}
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {/* Logo Section */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-600/20">
          <CloudUpload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-white">Smart Drive</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#8d90a0]">Enterprise Vault</p>
        </div>
      </div>

      {/* Upload Button */}
      <div className="mb-6 px-2">
        <button
          className="w-full py-3 px-4 bg-[#2563eb] text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-xl shadow-blue-600/10"
          onClick={onUploadClick}
        >
          <Upload className="w-5 h-5" />
          {t('drive.newUpload')}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {/* Global Nav */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8d90a0]">
            {t('drive.globalNav')}
          </p>
          <div className="space-y-1">
            {resolvedSpaces.map((space) => (
              <button
                key={space.id}
                onClick={() => {
                  setActiveSpace(space.id);
                  onClose?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeSpace === space.id
                    ? 'bg-blue-600/10 text-blue-500 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-[#32343d]'
                }`}
                aria-pressed={activeSpace === space.id}
              >
                <space.icon className="w-5 h-5" />
                {space.label}
              </button>
            ))}
          </div>
        </div>

        {/* Folders - Dynamic folders will be shown here */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8d90a0]">
            {t('drive.folders')}
          </p>
          <div className="space-y-1">
            {folders.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500 italic">{t('drive.noFolders')}</p>
            ) : (
              folders.slice(0, 8).map((folder) => (
                <button
                  key={folder.id}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#32343d]"
                  onClick={() => {
                    onFolderSelect?.(folder.path);
                    onClose?.();
                  }}
                >
                  <Folder className="w-4 h-4" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Storage Indicator */}
      <div className="mt-auto pt-6 px-2">
        <div className="bg-[#1d1f27] rounded-2xl p-4">
          <div className="flex justify-between text-[10px] font-bold mb-2">
            <span className="text-[#e1e2ed]">{t('drive.storageCardTitle').toUpperCase()}</span>
            <span className="text-[#b4c5ff]">{storagePercentage.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#32343d] rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-[#2563eb] transition-all" 
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-[#8d90a0]">
            {t('drive.storageUsed', { used: `${storageUsedMB} MB`, limit: `${storageLimitMB} MB` })}
          </p>
          <button className="mt-3 w-full py-2 text-[10px] font-bold text-white bg-[#32343d] rounded-lg hover:bg-[#434655] transition-colors">
            {t('drive.upgradePlan')}
          </button>
        </div>
      </div>
    </aside>
  );
}
