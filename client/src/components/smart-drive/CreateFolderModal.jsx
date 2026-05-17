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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--panel,white)] rounded-2xl w-full max-w-md border border-[var(--border,#e5e7eb)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border,#e5e7eb)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-tint,#eff6ff)] flex items-center justify-center">
              <Folder className="w-5 h-5 text-[var(--color-primary,#3b82f6)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text,#111827)]">
              {t('drive.createFolder')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted,#6b7280)] hover:text-[var(--text,#111827)] hover:bg-[var(--background-secondary,#f3f4f6)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text,#111827)] mb-2">
              {t('drive.folderName')}
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={t('drive.enterFolderName')}
              autoFocus
              className="w-full px-4 py-2 border border-[var(--border,#e5e7eb)] rounded-lg bg-[var(--background,white)] text-[var(--text,#111827)] placeholder-[var(--text-muted,#6b7280)] focus:ring-2 focus:ring-[var(--color-primary,#3b82f6)]/20 focus:border-[var(--color-primary,#3b82f6)] outline-none transition-all"
            />
          </div>

          {parentFolderId && (
            <p className="text-xs text-[var(--text-muted,#6b7280)]">
              {t('drive.folderWillBeCreatedIn')}: {t('drive.currentFolder')}
            </p>
          )}

          {error && (
            <div className="p-3 bg-[var(--color-error-tint,#fef2f2)] border border-[var(--color-error,#dc2626)] rounded-lg text-sm text-[var(--color-error,#dc2626)]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[var(--background-secondary,#f3f4f6)] text-[var(--text,#111827)] rounded-lg hover:bg-[var(--border,#e5e7eb)] transition-colors text-sm font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!folderName.trim() || creating}
              className="px-4 py-2 bg-[var(--color-primary,#3b82f6)] text-white rounded-lg hover:bg-[var(--color-primary,#3b82f6)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {creating ? t('drive.creating') : t('drive.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
