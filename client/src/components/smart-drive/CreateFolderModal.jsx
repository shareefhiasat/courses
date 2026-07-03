import { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon, getColoredFolderIcon } from '@constants/iconTypes';
import Modal from '@ui/Modal/Modal';
import Input from '@ui/Input/Input';
import Button from '@ui/Button/Button';

const FOLDER_COLORS = [
  { value: null, label: 'Default' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f97316', label: 'Orange' },
];

export default function CreateFolderModal({ parentFolderId, onCreate, onClose }) {
  const { t, lang } = useLang();
  const [folderName, setFolderName] = useState('');
  const [folderNameAr, setFolderNameAr] = useState('');
  const [folderColor, setFolderColor] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const validateFolderName = (name) => {
    if (!name.trim()) {
      return t('drive.folderNameRequired');
    }
    if (name.length > 30) {
      return t('drive.folderNameTooLong');
    }
    // Allow only alphanumeric, spaces, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validPattern.test(name)) {
      return t('drive.folderNameInvalid');
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateFolderName(folderName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const result = await onCreate(folderName.trim(), parentFolderId, folderNameAr.trim() || undefined, folderColor);
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('drive.createFolder')}
      size="small"
      className="create-folder-modal"
      titleStyle={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}
    >
      <div className="space-y-5">
        <Input
          label={t('drive.folderName')}
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder={t('drive.enterFolderName')}
          autoFocus
          fullWidth
          error={error}
          size="medium"
        />

        <Input
          label={t('drive.folderNameAr')}
          value={folderNameAr}
          onChange={(e) => setFolderNameAr(e.target.value)}
          placeholder={t('drive.enterFolderNameAr')}
          fullWidth
          size="medium"
        />

        <div>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-secondary, #374151)', marginBottom: '0.5rem', display: 'block' }}>
            {t('drive.folderColor')}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {FOLDER_COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setFolderColor(c.value)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '0.5rem',
                  border: folderColor === c.value ? '2px solid var(--color-primary, #2563eb)' : '2px solid transparent',
                  background: c.value || 'var(--background-secondary, #f3f4f6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  transform: folderColor === c.value ? 'scale(1.1)' : 'scale(1)',
                }}
                title={c.label}
              >
                {c.value
                  ? getColoredFolderIcon(16, c.value)
                  : getThemedIcon('ui', 'folder', 16, 'muted')
                }
              </button>
            ))}
          </div>
        </div>

        {parentFolderId && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('drive.folderWillBeCreatedIn')}: {t('drive.currentFolder')}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!folderName.trim() || creating}
            loading={creating}
          >
            {creating ? t('drive.creating') : t('drive.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
