import { useState } from 'react';
import { Search, Bell, Settings, Plus, FolderPlus, UploadCloud, MoreVertical, Grid, List, Filter, FileText, Image, Film, FileSpreadsheet, Folder, Star, Clock, Share2, Download, Trash2 } from 'lucide-react';
import styles from './SmartDriveRedesign.module.css';

/**
 * SmartDriveRedesign - Standalone component matching Figma design exactly
 * Uses CSS Modules for true CSS isolation from global app styles
 */
export default function SmartDriveRedesign() {
  const [viewMode, setViewMode] = useState('list');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const recentlyUsed = [
    { id: 1, name: 'My projects', type: 'folder', time: '2h ago', count: '48 files' },
    { id: 2, name: 'Family photo', type: 'image', time: 'yesterday', size: '4.2 MB' },
    { id: 3, name: 'My document', type: 'document', time: '5h ago', size: '12 KB' },
    { id: 4, name: 'Holiday 2023', type: 'image', time: '1d ago', size: '256 MB' },
    { id: 5, name: 'Annual Budget', type: 'spreadsheet', time: '3d ago', size: '1.4 MB' },
  ];

  const allFiles = [
    { id: 1, name: 'Client Deliverables', type: 'folder', modified: 'Oct 24, 2023, 11:30 AM', size: '--', priority: true },
    { id: 2, name: 'Q3_Report_Final.pdf', type: 'document', modified: 'Oct 22, 2023, 09:15 AM', size: '12.4 MB', priority: false },
    { id: 3, name: 'Dashboard_UI_V2.png', type: 'image', modified: 'Oct 20, 2023, 04:45 PM', size: '3.8 MB', priority: false },
    { id: 4, name: 'Product_Intro_Draft.mp4', type: 'video', modified: 'Oct 19, 2023, 01:20 PM', size: '142 MB', priority: false },
    { id: 5, name: 'Financial_Forecast_24.xlsx', type: 'spreadsheet', modified: 'Oct 18, 2023, 10:00 AM', size: '840 KB', priority: false },
  ];

  const getFileIcon = (type) => {
    switch (type) {
      case 'folder':
        return <Folder className="w-5 h-4 text-violet-300" />;
      case 'image':
        return <Image className="w-5 h-4 text-violet-300" />;
      case 'document':
        return <FileText className="w-5 h-4 text-red-300" />;
      case 'video':
        return <Film className="w-5 h-4 text-violet-300" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
      default:
        return <FileText className="w-5 h-4 text-zinc-400" />;
    }
  };

  const getFileTypeLabel = (type) => {
    switch (type) {
      case 'folder': return 'FOLDER';
      case 'image': return 'IMAGE';
      case 'document': return 'DOCUMENT';
      case 'video': return 'VIDEO';
      case 'spreadsheet': return 'SPREADSHEET';
      default: return 'FILE';
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'folder': return 'bg-violet-300/10';
      case 'image': return 'bg-violet-300/10';
      case 'document': return 'bg-red-300/10';
      case 'video': return 'bg-violet-300/10';
      case 'spreadsheet': return 'bg-green-600/10';
      default: return 'bg-neutral-800';
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <UploadCloud className="w-5 h-4 text-white" />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Smart Drive</span>
              <span className={styles.logoSubtitle}>ENTERPRISE VAULT</span>
            </div>
          </div>
        </div>

        <div className={styles.uploadButton}>
          <button>
            <Plus className="w-5 h-5" />
            <span>Upload New</span>
          </button>
        </div>

        <div className={styles.navSection}>
          <div className={styles.navLabel}>GLOBAL NAV</div>
          <button className={styles.navItemActive}>
            <Folder className="w-5 h-4" />
            <span>My Files</span>
          </button>
          <button className={styles.navItem}>
            <Image className="w-4 h-4" />
            <span>Photos</span>
          </button>
          <button className={styles.navItem}>
            <Star className="w-5 h-5" />
            <span>Starred</span>
          </button>
          <button className={styles.navItem}>
            <Clock className="w-5 h-5" />
            <span>Recent</span>
          </button>
          <button className={styles.navItem}>
            <Share2 className="w-4 h-5" />
            <span>Shared</span>
          </button>
          <button className={styles.navItem}>
            <Trash2 className="w-4 h-4" />
            <span>Trash</span>
          </button>
        </div>

        <div className={styles.foldersSection}>
          <div className={styles.navSection}>
            <div className={styles.navLabel}>FOLDERS</div>
            <div className={styles.navSection}>
              <button className={styles.folderItem}>
                <span className="w-1.5 h-1 bg-slate-400 rotate-90" />
                <Folder className="w-3 h-2.5" />
                <span>Projects</span>
              </button>
              <div className={styles.folderSubItems}>
                <span className={styles.folderSubItem}>Q4 Campaign</span>
                <span className={styles.folderSubItem}>System Overhaul</span>
              </div>
              <button className={styles.folderItem}>
                <span className="w-1 h-1.5 bg-slate-400" />
                <Folder className="w-3 h-2.5" />
                <span>Finance</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.storageIndicator}>
          <div className={styles.storageCard}>
            <div className={styles.storageHeader}>
              <span className={styles.storageLabel}>STORAGE</span>
              <span className={styles.storageValue}>82%</span>
            </div>
            <div className={styles.storageBar}>
              <div className={styles.storageProgress} />
            </div>
            <span className={styles.storageText}>164.2 GB of 200 GB used</span>
            <button className={styles.upgradeButton}>UPGRADE</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <div className={styles.searchInput}>
                <div className={styles.searchPlaceholder}>Search files, folders and assets...</div>
              </div>
              <div className={styles.searchIcon}>
                <Search className="w-4 h-4 text-zinc-400" />
              </div>
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            <div className={styles.actionButtonsGroup}>
              <div className={styles.actionButtonsLeft}>
                <button className={styles.actionButton}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>New file</span>
                </button>
                <button className={styles.actionButton}>
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create folder</span>
                </button>
                <button className={styles.actionButton}>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Request</span>
                </button>
              </div>
              
              <div className={styles.userActions}>
                <button className={styles.notificationButton}>
                  <Bell className="w-4 h-5" />
                  <span className={styles.notificationDot} />
                </button>
                <button className={styles.notificationButton}>
                  <Settings className="w-5 h-5" />
                </button>
                <div className={styles.userAvatar}>
                  <div className={styles.avatarInner}>U</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.contentArea}>
          
          {/* Recently Used Section */}
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionTitleText}>Recently used</span>
              <span className={styles.sectionBadge}>
                <span className={styles.sectionBadgeText}>14 Assets</span>
              </span>
            </div>
            <button className={styles.viewAllButton}>VIEW ALL</button>
          </div>
            
          <div className={styles.cardGrid}>
            {recentlyUsed.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardPreview}>
                  {item.type === 'folder' ? (
                    <Folder className="w-7 h-6 text-violet-300/40" />
                  ) : item.type === 'image' ? (
                    <div className="w-36 h-16 bg-gradient-to-r from-black/20 to-transparent opacity-0" />
                  ) : (
                    <div className="w-16 h-20 p-2 relative bg-neutral-700 rounded-md">
                      {item.type === 'document' && (
                        <span className="absolute left-[8px] top-[47px] px-2 py-1 bg-blue-600/80 rounded-sm backdrop-blur-[6px] text-white text-[10px] font-bold">DOCX</span>
                      )}
                      {item.type === 'spreadsheet' && (
                        <span className="absolute left-[8px] top-[47px] px-2 py-1 bg-green-600/80 rounded-sm backdrop-blur-[6px] text-white text-[10px] font-bold">XLSX</span>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <div>
                    <span className={styles.cardName}>{item.name}</span>
                    <span className={styles.cardMeta}>
                      {item.type === 'folder' ? `Edited ${item.time} • ${item.count}` : item.type === 'image' ? `Uploaded ${item.time} • ${item.size}` : `Edited ${item.time} • ${item.size}`}
                    </span>
                  </div>
                  <MoreVertical className="w-1 h-4 text-zinc-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Files Section */}
        <div className={styles.allFilesSection}>
          <div className={styles.allFilesHeader}>
            <span className={styles.sectionTitleText}>All files</span>
            <div className={styles.viewToggle}>
              <button className={styles.viewToggleButton}>
                <Filter className="w-4 h-3" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`${viewMode === 'grid' ? styles.viewToggleButtonActive : styles.viewToggleButton}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`${viewMode === 'list' ? styles.viewToggleButtonActive : styles.viewToggleButton}`}
              >
                <List className="w-5 h-4" />
              </button>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'list' && (
            <div className={styles.tableContainer}>
              {/* Table Header */}
              <div className={styles.tableHeader}>
                <div className={styles.tableHeaderCell}>
                  <input type="checkbox" className="size-4 bg-neutral-800 rounded-sm border border-gray-700" />
                </div>
                <div className={styles.tableHeaderCell}>NAME</div>
                <div className={styles.tableHeaderCell}>LAST MODIFIED</div>
                <div className={styles.tableHeaderCell}>SIZE</div>
                <div className={styles.tableHeaderCell}>MANAGE</div>
              </div>

                {/* Table Rows */}
                {allFiles.map((file) => (
                  <div key={file.id} className="self-stretch pr-8 border-t border-gray-700/10 inline-flex justify-center items-center hover:bg-neutral-800/30 transition-colors group">
                    <div className="w-16 pl-8 pr-4 py-7">
                      <input type="checkbox" className="size-4 bg-neutral-800 rounded-sm border border-gray-700" />
                    </div>
                    <div className="w-80 pl-4 flex justify-start items-center gap-4">
                      <div className={`size-10 rounded-xl flex justify-center items-center ${getFileTypeColor(file.type)}`}>
                        {getFileIcon(file.type)}
                      </div>
                      <div className="inline-flex flex-col justify-start items-start">
                        <span className="text-white text-sm font-semibold">{file.name}</span>
                        {file.priority && (
                          <div className="inline-flex justify-start items-center gap-1">
                            <span className="size-1.5 bg-violet-300 rounded-full" />
                            <span className="text-zinc-400 text-[10px] font-bold uppercase">PRIORITY</span>
                          </div>
                        )}
                        {!file.priority && (
                          <span className="text-zinc-400 text-[10px] font-bold uppercase">{getFileTypeLabel(file.type)}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-60 pl-8 pr-4 py-7">
                      <span className="text-zinc-400 text-xs font-normal">{file.modified}</span>
                    </div>
                    <div className="w-24 px-4 py-7">
                      <span className="text-zinc-400 text-xs font-normal">{file.size}</span>
                    </div>
                    <div className="w-48 pl-4 opacity-0 group-hover:opacity-100 flex justify-end items-center gap-2 transition-opacity">
                      <button className="px-3 py-1.5 bg-neutral-700 rounded-lg text-gray-200 text-[10px] font-bold hover:bg-neutral-600 transition-colors">
                        COPY
                      </button>
                      <button className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                        <Download className="size-3.5" />
                      </button>
                      <button className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                        <Share2 className="w-[3px] h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allFiles.map((file) => (
                    <div key={file.id} className="p-4 bg-zinc-900 rounded-xl border border-gray-700/10 hover:border-violet-300/30 transition-all cursor-pointer">
                      <div className="aspect-square bg-neutral-800 rounded-lg mb-3 flex items-center justify-center">
                        <div className={`size-16 rounded-xl flex justify-center items-center ${getFileTypeColor(file.type)}`}>
                          {getFileIcon(file.type)}
                        </div>
                      </div>
                      <span className="text-white text-sm font-semibold block truncate">{file.name}</span>
                      <span className="text-zinc-400 text-[10px] block">{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            <div className="self-stretch px-8 py-4 bg-neutral-800/30 border-t border-gray-700/10 inline-flex justify-between items-center">
              <span className="text-zinc-400 text-xs font-normal">Showing 5 of 148 assets</span>
              <div className="flex justify-start items-center gap-4">
                <button className="flex justify-start items-center gap-2 text-zinc-400 text-xs font-bold hover:text-white transition-colors">
                  <span className="w-1 h-1.5 bg-zinc-400" />
                  Previous
                </button>
                <div className="flex justify-start items-center gap-1">
                  <span className="size-6 pt-1 pb-[5px] bg-violet-300 rounded-sm flex justify-center items-center text-sky-900 text-[10px] font-bold">1</span>
                  <span className="size-6 pt-1 pb-[5px] rounded-sm flex justify-center items-center text-zinc-400 text-[10px] font-bold hover:bg-neutral-700 cursor-pointer">2</span>
                  <span className="size-6 pt-1 pb-[5px] rounded-sm flex justify-center items-center text-zinc-400 text-[10px] font-bold hover:bg-neutral-700 cursor-pointer">3</span>
                </div>
                <button className="flex justify-start items-center gap-2 text-zinc-400 text-xs font-bold hover:text-white transition-colors">
                  Next
                  <span className="w-1 h-1.5 bg-zinc-400" />
                </button>
              </div>
            </div>
          </div>

        {/* Floating Action Button */}
        <button className={styles.fab}>
          <Plus className={styles.fabIcon} />
        </button>
      </div>
    </div>
  );
}
