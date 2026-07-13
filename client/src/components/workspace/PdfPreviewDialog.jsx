import React, { useState, useCallback, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import { exportDailyOfficialForDate } from '@services/business/accessScopeExportService.js';
import { RefreshCw, Maximize2, Minimize2, ShieldCheck } from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton, IconButton as MuiIconButton, Box, CircularProgress, Typography, Chip } from '@mui/material';

/**
 * Reusable PDF preview dialog.
 *
 * When `fileId` is provided, fetches the filed/approved document from Smart Drive
 * (no live regeneration — stable timestamp).
 * When no `fileId`, generates a live PDF from current attendance data.
 */
export default function PdfPreviewDialog({
  open,
  onClose,
  cls,
  program,
  subject,
  academicTerm,
  date,
  instructorName,
  user,
  title,
  fileId,
  isApproved = false,
}) {
  const { t, lang } = useLang();
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const useFiledDoc = !!fileId;

  const loadFiledDocument = useCallback(async () => {
    setPreviewUrl(null);
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('keycloak_token');
      const response = await fetch(`/api/v1/drive/files/${fileId}/preview`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await response.json();
      if (data.success && data.payload?.url) {
        setPreviewUrl(data.payload.url);
      } else {
        setError(data.error?.message || data.error || (t('operations_board_preview_failed') || 'Preview unavailable'));
      }
    } catch (err) {
      console.error('[PdfPreviewDialog] filed doc preview failed:', err);
      setError(err.message || (t('operations_board_preview_failed') || 'Preview unavailable'));
    } finally {
      setLoading(false);
    }
  }, [fileId, t]);

  const generateLivePreview = useCallback(async () => {
    setPreviewUrl(null);
    setError(null);
    setLoading(true);
    try {
      const result = await exportDailyOfficialForDate({
        cls,
        program,
        subject,
        academicTerm,
        lang,
        user,
        date,
        instructorName,
        format: EXPORT_FORMAT.PDF,
        skipDownload: true,
        skipPersist: true,
      });
      if (result?.blob) {
        const url = URL.createObjectURL(result.blob);
        setPreviewUrl(url);
      } else {
        setError(t('live_preview_failed') || 'Failed to generate preview');
      }
    } catch (err) {
      console.error('[PdfPreviewDialog] live preview failed:', err);
      setError(err.message || (t('live_preview_failed') || 'Failed to generate preview'));
    } finally {
      setLoading(false);
    }
  }, [cls, program, subject, academicTerm, lang, user, date, instructorName, t]);

  const handleRefresh = useFiledDoc ? loadFiledDocument : generateLivePreview;

  const handleClose = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    setPreviewExpanded(false);
    onClose();
  }, [previewUrl, onClose]);

  useEffect(() => {
    if (open) {
      if (useFiledDoc) {
        loadFiledDocument();
      } else if (cls?.id && date) {
        generateLivePreview();
      }
    }
    if (!open) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setError(null);
    }
  }, [open]);

  const chipLabel = useFiledDoc
    ? (isApproved ? (t('approved') || 'APPROVED') : (t('filed') || 'FILED'))
    : (t('live_preview') || 'LIVE');
  const chipColor = useFiledDoc ? (isApproved ? 'success' : 'warning') : 'success';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={previewExpanded ? false : 'md'}
      fullWidth={!previewExpanded}
      fullScreen={previewExpanded}
      data-testid="pdf-preview-dialog"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {useFiledDoc && isApproved && <ShieldCheck size={18} style={{ color: '#16a34a' }} />}
        <span>{title || (t('operations_board_preview_pdf') || 'Preview PDF')}</span>
        <Chip
          label={chipLabel}
          size="small"
          color={chipColor}
          sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
        />
        <MuiButton
          size="small"
          startIcon={<RefreshCw size={14} />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{ ml: 'auto', textTransform: 'none' }}
        >
          {t('refresh') || 'Refresh'}
        </MuiButton>
        <MuiIconButton
          size="small"
          onClick={() => setPreviewExpanded((prev) => !prev)}
          aria-label={previewExpanded ? (t('schedule_collapse') || 'Collapse') : (t('schedule_expand') || 'Expand')}
          sx={{ textTransform: 'none' }}
        >
          {previewExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </MuiIconButton>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5, flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              {useFiledDoc
                ? (t('loading_filed_document') || 'Loading filed document…')
                : (t('generating_live_preview') || 'Generating live preview from current attendance data…')}
            </Typography>
          </Box>
        )}
        {!loading && error && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="error">{error}</Typography>
            <MuiButton size="small" variant="outlined" onClick={handleRefresh} startIcon={<RefreshCw size={14} />}>
              {t('retry') || 'Retry'}
            </MuiButton>
          </Box>
        )}
        {!loading && previewUrl && (
          <Box sx={{ width: '100%', minHeight: 420 }}>
            <iframe
              title={useFiledDoc ? 'Filed PDF Preview' : 'Live PDF Preview'}
              src={previewUrl}
              style={{ width: '100%', height: 420, border: '1px solid #e0e0e0', borderRadius: 4 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <MuiButton onClick={handleClose}>
          {t('close') || 'Close'}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}
