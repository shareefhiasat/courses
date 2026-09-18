/**
 * Upload Signed Document Dialog
 *
 * PURPOSE: Shared dialog for uploading a signed (printed & signed) copy of an
 * approved daily/weekly attendance workflow document.
 * Used by ScheduleContextMenu, WorkflowDocumentDetailPage, board tooltips, etc.
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  CircularProgress,
} from '@mui/material';
import { FileSignature, Paperclip, X } from 'lucide-react';
import { useToast } from '@ui';
import { Card } from '@/components/kibo/ui/card';
import { useLang } from '@contexts/LangContext';
import { uploadSignedDocument } from '@services/api/workflow-documents-api.js';

function UploadSignedDialog({ open, onClose, documentId, onUploaded }) {
  const { t } = useLang();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setComment('');
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    reset();
    onClose?.();
  }, [loading, reset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      toast.error(t('workflow.document.fileRequired', 'File is required for upload'));
      return;
    }
    if (!documentId) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileData = e.target.result.split(',')[1];
          const result = await uploadSignedDocument(documentId, {
            fileData,
            fileName: file.name,
            fileType: file.type,
            comment: comment || undefined,
          });
          if (result.success) {
            toast.success(t('signed_copy_uploaded', 'Signed copy uploaded successfully'));
            onUploaded?.(result.data);
            reset();
            onClose?.();
          } else {
            toast.error(result.error || t('workflow.document.uploadError', 'Failed to upload signed document'));
          }
        } catch (err) {
          toast.error(t('workflow.document.uploadError', 'Failed to upload signed document'));
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        toast.error(t('workflow.document.fileReadError', 'Failed to read file'));
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(t('workflow.document.uploadError', 'Failed to upload signed document'));
      setLoading(false);
    }
  }, [file, comment, documentId, t, toast, onUploaded, onClose, reset]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{ className: 'border-0 shadow-xl' }}
    >
      <DialogTitle className="flex items-center justify-between pr-4">
        <div className="flex items-center gap-2">
          <FileSignature size={18} style={{ color: '#8b5cf6' }} />
          <span className="font-semibold text-base">
            {t('upload_signed_copy', 'Upload signed copy')}
          </span>
        </div>
        <IconButton onClick={handleClose} size="small" disabled={loading}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent className="py-4 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground m-0">
          {t(
            'upload_signed_copy_hint',
            'Upload the printed document after it has been signed. The signed copy is attached to this workflow without changing its status.'
          )}
        </p>

        <Card className="p-4 border-0 shadow-sm">
          <div className="flex flex-col gap-3">
            <TextField
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              size="small"
              placeholder={t('workflow.document.optionalComment', 'Add optional comment...')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="small"
                variant="outlined"
                component="label"
                startIcon={<Paperclip size={16} />}
                disabled={loading}
              >
                {file
                  ? (file.name.length > 30 ? `${file.name.slice(0, 27)}...` : file.name)
                  : (t('violations.attach_file_optional', 'Attach file (optional)'))}
                <input
                  type="file"
                  hidden
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              {file && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setFile(null)}
                  disabled={loading}
                >
                  {t('violations.remove', 'Remove')}
                </Button>
              )}
              <span className="ms-auto">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !file}
                  size="small"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FileSignature size={16} />}
                  sx={{
                    bgcolor: '#8b5cf6',
                    '&:hover': { bgcolor: '#7c3aed' },
                    '&.Mui-disabled': { bgcolor: 'rgba(139,92,246,0.35)', color: '#fff' },
                  }}
                >
                  {loading
                    ? t('common.processing', 'Processing...')
                    : t('workflow.document.uploadSigned', 'Upload Signed')}
                </Button>
              </span>
            </div>
          </div>
        </Card>
      </DialogContent>

      <DialogActions className="px-4 py-3 border-t border-slate-200 gap-2 bg-transparent">
        <Button onClick={handleClose} size="small" color="inherit" disabled={loading}>
          {t('common.cancel', 'Cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UploadSignedDialog;
