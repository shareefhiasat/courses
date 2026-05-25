import { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import Modal from '@ui/Modal/Modal';
import Input from '@ui/Input/Input';
import Button from '@ui/Button/Button';

export default function CreateFolderModal({ parentFolderId, onCreate, onClose }) {
  const { t } = useLang();
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const validateFolderName = (name) => {
    if (!name.trim()) {
      return t('drive.folderNameRequired');
    }
    if (name.length > 30) {
      return t('drive.folderNameTooLong') || 'Folder name must be 30 characters or less';
    }
    // Allow only alphanumeric, spaces, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validPattern.test(name)) {
      return t('drive.folderNameInvalid') || 'Folder name can only contain letters, numbers, spaces, hyphens, and underscores';
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('drive.createFolder')}
      size="small"
      className="create-folder-modal"
      titleStyle={{ fontSize: '1.125rem', fontWeight: '600' }}
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
