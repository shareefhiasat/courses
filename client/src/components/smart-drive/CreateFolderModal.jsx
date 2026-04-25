import { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { X, Folder } from 'lucide-react';

/**
 * CreateFolderModal - New folder dialog
 * Creates folder via POST /api/v1/drive/folders
 */
export default function CreateFolderModal({ parentFolderId, onCreate, onClose }) {
  const { t } = useLang();
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError(t('drive.folderNameRequired'));
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const result = await onCreate(folderName.trim(), parentFolderId);
      if (result.success) {
        onClose();
      } else {
        setError(result.error?.message || t('drive.createFolderFailed'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#191b23] rounded-2xl w-full max-w-md border border-[#434655]/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#434655]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2563eb]/10 flex items-center justify-center">
              <Folder className="w-5 h-5 text-[#b4c5ff]" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {t('drive.createFolder')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8d90a0] hover:text-white hover:bg-[#32343d] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
              {t('drive.folderName')}
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={t('drive.enterFolderName')}
              autoFocus
              className="w-full px-4 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white placeholder-[#8d90a0] focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all"
            />
          </div>

          {parentFolderId && (
            <p className="text-xs text-[#8d90a0]">
              {t('drive.folderWillBeCreatedIn')}: {t('drive.currentFolder')}
            </p>
          )}

          {error && (
            <div className="p-3 bg-[#4e1d1d] border border-[#6a2d2d] rounded-lg text-sm text-[#ffb4ab]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#32343d] text-white rounded-lg hover:bg-[#434655] transition-colors text-sm font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || creating}
              className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {creating ? t('drive.creating') : t('drive.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
