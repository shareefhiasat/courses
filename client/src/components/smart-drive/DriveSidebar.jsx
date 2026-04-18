import { useState } from 'react';
import { CloudUpload, Upload, Folder, ChevronDown, Image, Star, Clock, Share2, Trash2 } from 'lucide-react';
import { useLang } from '@contexts/LangContext';

/**
 * DriveSidebar - Sidebar navigation for SmartDrive (Figma Dark Theme)
 * Features: Space navigation, pinned spaces, folders section, storage indicator
 */
export default function DriveSidebar({ 
  activeSpace, 
  setActiveSpace, 
  storageUsage = 0, 
  storageLimit = 500 * 1024 * 1024 
}) {
  const { t } = useLang();
  const [expandedFolders, setExpandedFolders] = useState(true);

  const storagePercentage = Math.min((storageUsage / storageLimit) * 100, 100);
  const storageUsedGB = (storageUsage / (1024 * 1024 * 1024)).toFixed(1);
  const storageLimitGB = (storageLimit / (1024 * 1024 * 1024)).toFixed(0);

  const spaces = [
    { id: 'my-drive', label: t('drive.myDrive'), icon: Folder },
    { id: 'photos', label: t('drive.photos'), icon: Image },
    { id: 'starred', label: t('drive.starred'), icon: Star },
    { id: 'recent', label: t('drive.recent'), icon: Clock },
    { id: 'shared', label: t('drive.sharedWithMe'), icon: Share2 },
    { id: 'trash', label: t('drive.trash'), icon: Trash2 },
  ];

  return (
    <aside className="h-full w-64 fixed left-0 top-0 overflow-y-auto bg-[#191b23] dark:bg-[#191b23] font-['Inter'] antialiased text-sm tracking-tight flex flex-col p-4 gap-2 z-50">
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
        <button className="w-full py-3 px-4 bg-[#2563eb] text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-xl shadow-blue-600/10">
          <Upload className="w-5 h-5" />
          Upload New
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {/* Global Nav */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8d90a0]">
            Global Nav
          </p>
          <div className="space-y-1">
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => setActiveSpace(space.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeSpace === space.id
                    ? 'bg-blue-600/10 text-blue-500 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-[#32343d]'
                }`}
              >
                <space.icon className="w-5 h-5" />
                {space.label}
              </button>
            ))}
          </div>
        </div>

        {/* Folders */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8d90a0]">
            Folders
          </p>
          <div className="space-y-1">
            <button
              onClick={() => setExpandedFolders(!expandedFolders)}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-[#32343d] transition-all rounded-xl"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedFolders ? 'rotate-90' : ''}`} />
              <Folder className="w-4 h-4" />
              <span>Projects</span>
            </button>
            {expandedFolders && (
              <div className="ml-8 mt-1 space-y-1 border-l border-[#434655]/30">
                <a href="#" className="block px-4 py-1.5 text-xs text-slate-500 hover:text-[#b4c5ff]">Q4 Campaign</a>
                <a href="#" className="block px-4 py-1.5 text-xs text-slate-500 hover:text-[#b4c5ff]">System Overhaul</a>
              </div>
            )}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-[#32343d] transition-all rounded-xl">
              <ChevronDown className="w-4 h-4" />
              <Folder className="w-4 h-4" />
              <span>Finance</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Storage Indicator */}
      <div className="mt-auto pt-6 px-2">
        <div className="bg-[#1d1f27] rounded-2xl p-4">
          <div className="flex justify-between text-[10px] font-bold mb-2">
            <span className="text-[#e1e2ed]">STORAGE</span>
            <span className="text-[#b4c5ff]">{storagePercentage.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#32343d] rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-[#2563eb] transition-all" 
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-[#8d90a0]">
            {storageUsedGB} GB of {storageLimitGB} GB used
          </p>
          <button className="mt-3 w-full py-2 text-[10px] font-bold text-white bg-[#32343d] rounded-lg hover:bg-[#434655] transition-colors">
            UPGRADE
          </button>
        </div>
      </div>
    </aside>
  );
}
