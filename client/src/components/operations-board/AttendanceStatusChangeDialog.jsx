import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { X, Paperclip, FileText, Heart } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { uploadChatAttachment } from '@services/business/attendanceDeductionService.js';
import { ATTENDANCE_BOARD_LANES } from '@services/business/operationsBoardService.js';
import { getAttendanceBoardColor } from '@constants/workspaceStatusColors';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';

export default function AttendanceStatusChangeDialog({
  open,
  onClose,
  onConfirm,
  item,
  fromColumn,
  toColumn,
  roleContext = {},
}) {
  const { t, lang } = useLang();
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const isExcused = toColumn === ATTENDANCE_BOARD_LANES.EXCUSED;
  const isHumanCase = toColumn === ATTENDANCE_BOARD_LANES.HUMAN_CASE;
  const statusColor = getAttendanceBoardColor(toColumn);

  const config = useMemo(() => {
    if (isExcused) {
      return {
        icon: FileText,
        titleKey: 'attendance_status_change_dialog_excused_title',
        notePlaceholderKey: 'attendance_status_change_note_optional',
        fileLabelKey: 'attendance_status_change_file_required',
        requireNote: false,
        requireFile: true,
      };
    }
    if (isHumanCase) {
      return {
        icon: Heart,
        titleKey: 'attendance_status_change_dialog_human_title',
        notePlaceholderKey: 'attendance_status_change_note_required',
        fileLabelKey: 'attendance_status_change_file_optional',
        requireNote: true,
        requireFile: false,
      };
    }
    return null;
  }, [isExcused, isHumanCase]);

  useEffect(() => {
    if (open) {
      setNote('');
      setFile(null);
      setUploading(false);
      setError(null);
    }
  }, [open]);

  const handleConfirm = useCallback(async () => {
    setError(null);

    if (config.requireNote && !note.trim()) {
      setError(t('attendance_status_change_note_required_error') || 'A note is required.');
      return;
    }

    if (config.requireFile && !file) {
      setError(t('attendance_status_change_file_required_error') || 'A document is required.');
      return;
    }

    let attachment = null;
    if (file) {
      setUploading(true);
      try {
        attachment = await uploadChatAttachment(file);
      } catch (err) {
        setError(err.message || t('attendance_status_change_upload_failed') || 'Failed to upload file.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onConfirm?.({
      notes: note.trim() || null,
      attachment: attachment
        ? { url: attachment.url, name: attachment.name, type: attachment.type }
        : null,
    });
  }, [config, file, note, onConfirm, t]);

  if (!config) return null;

  const TitleIcon = config.icon;
  const studentName = item
    ? (lang === 'ar' ? item.displayNameAr || item.displayName : item.displayName || item.displayNameAr)
    : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle className="flex items-center justify-between pr-4 gap-3">
        <div className="flex items-center gap-3">
          {item && (
            <BoardStudentAvatar
              name={studentName}
              profileImageUrl={item.profileImageUrl}
              size="md"
            />
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <TitleIcon size={18} style={{ color: statusColor }} />
              <span className="font-semibold text-base">
                {t(config.titleKey) || (isExcused ? 'Mark as Excused Leave' : 'Mark as Human Case')}
              </span>
            </div>
            {studentName && (
              <span className="text-xs text-muted-foreground">{studentName}</span>
            )}
          </div>
        </div>
        <IconButton onClick={onClose} size="small" disabled={uploading}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent className="py-4 flex flex-col gap-4">
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          multiline
          minRows={2}
          maxRows={4}
          size="small"
          sx={{ width: '75%' }}
          label={t(config.notePlaceholderKey) || (config.requireNote ? 'Note (required)' : 'Note (optional)')}
          placeholder={t(config.notePlaceholderKey) || (config.requireNote ? 'Enter the reason for human case' : 'Enter an optional note')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={uploading}
          required={config.requireNote}
        />

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            size="small"
            variant="outlined"
            component="label"
            startIcon={<Paperclip size={16} />}
            disabled={uploading}
            color={config.requireFile && !file ? 'error' : 'primary'}
          >
            {file
              ? (file.name.length > 35 ? `${file.name.slice(0, 32)}...` : file.name)
              : (t(config.fileLabelKey) || (config.requireFile ? 'Attach document (required)' : 'Attach document (optional)'))}
            <input
              type="file"
              hidden
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
                if (error) setError(null);
              }}
            />
          </Button>
          {file && (
            <Button
              size="small"
              color="error"
              onClick={() => setFile(null)}
              disabled={uploading}
            >
              {t('remove') || 'Remove'}
            </Button>
          )}
        </div>
      </DialogContent>

      <DialogActions className="px-4 pb-4">
        <Button onClick={onClose} disabled={uploading} size="small">
          {t('cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={uploading}
          size="small"
          variant="contained"
          sx={{ backgroundColor: statusColor, '&:hover': { backgroundColor: statusColor, filter: 'brightness(0.9)' } }}
          startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {uploading
            ? (t('uploading') || 'Uploading...')
            : (t('confirm') || 'Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
