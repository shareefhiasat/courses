import React, { useState, useCallback, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import { exportDailyOfficialForDate, exportDailyOfficialTemplate, exportWeeklyScheduleForProgram } from '@services/business/accessScopeExportService.js';
import { academicTermToYearTerm } from '@utils/academicTermUtils.js';
import { ExternalLink, ShieldCheck, FileText } from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton, IconButton as MuiIconButton, Box, CircularProgress, Typography, Chip, Alert } from '@mui/material';
import { getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { ROLE_STRINGS } from '@utils/userUtils';

/**
 * Reusable PDF preview dialog.
 *
 * When `fileId` is provided, fetches the filed/approved document from Smart Drive
 * (no live regeneration — stable timestamp).
 * When no `fileId`, generates a live PDF from current attendance data.
 * When `isTemplate` is true, generates a daily template PDF.
 * When `isWeeklySchedule` is true, generates a weekly schedule PDF.
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
  isTemplate = false,
  isWeeklySchedule = false,
}) {
  const { t, lang } = useLang();
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
      let result;
      if (isTemplate) {
        result = await exportDailyOfficialTemplate({
          cls,
          program,
          subject,
          academicTerm,
          lang,
          user,
          format: EXPORT_FORMAT.PDF,
          instructorName,
          skipDownload: true,
        });
      } else if (isWeeklySchedule) {
        const { year, term } = academicTerm ? academicTermToYearTerm(academicTerm) : { year: '', term: '' };
        result = await exportWeeklyScheduleForProgram({
          program,
          academicTerm,
          year,
          term,
          lang,
          t,
          user,
          format: EXPORT_FORMAT.PDF,
          skipDownload: true,
        });
      } else {
        result = await exportDailyOfficialForDate({
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
      }
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
  }, [cls, program, subject, academicTerm, lang, user, date, instructorName, t, isTemplate, isWeeklySchedule]);

  const handleRefresh = useFiledDoc ? loadFiledDocument : generateLivePreview;

  const handleClose = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    onClose();
  }, [previewUrl, onClose]);

  useEffect(() => {
    if (open) {
      if (useFiledDoc) {
        loadFiledDocument();
      } else if (cls?.id && date) {
        generateLivePreview();
      } else if (isTemplate || isWeeklySchedule) {
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
  }, [open, useFiledDoc, cls?.id, date, isTemplate, isWeeklySchedule, loadFiledDocument, generateLivePreview]);

  const chipLabel = useFiledDoc
    ? (isApproved ? (t('approved') || 'APPROVED') : (t('filed') || 'FILED'))
    : (t('live_preview') || 'LIVE');
  const chipColor = useFiledDoc ? (isApproved ? 'success' : 'warning') : 'success';

  // Determine user role for icon display
  const userRole = user?.roles?.[0]?.code || user?.role?.code;
  const roleIcon = userRole && (userRole?.toLowerCase?.() === ROLE_STRINGS.ADMIN || userRole?.toLowerCase?.() === ROLE_STRINGS.HR)
    ? React.cloneElement(getUserRoleIcon(userRole), { size: 16, style: { color: getUserRoleColor(userRole) } })
    : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 2 } }}
      data-testid="pdf-preview-dialog"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        {useFiledDoc && isApproved && <ShieldCheck size={16} style={{ color: '#16a34a' }} />}
        {roleIcon}
        <span style={{ fontSize: '1rem', fontWeight: 600 }}>{title || (t('operations_board_preview_pdf') || 'Preview PDF')}</span>
        <Chip
          label={chipLabel}
          size="small"
          color={chipColor}
          sx={{ height: 18, fontSize: 9, fontWeight: 700 }}
        />
      </DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, flexDirection: 'column', gap: 1.5 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {useFiledDoc
                ? (t('loading_filed_document') || 'Loading filed document…')
                : (t('generating_live_preview') || 'Generating live preview…')}
            </Typography>
          </Box>
        )}
        {!loading && error && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error" sx={{ fontSize: '0.875rem' }}>{error}</Typography>
            <MuiButton size="small" variant="outlined" onClick={handleRefresh} sx={{ fontSize: '0.875rem' }}>
              {t('retry') || 'Retry'}
            </MuiButton>
          </Box>
        )}
        {!loading && previewUrl && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2, textAlign: 'center' }}>
            <MuiButton
              variant="contained"
              startIcon={<ExternalLink size={14} />}
              onClick={() => {
                if (previewUrl) {
                  window.open(previewUrl, '_blank');
                }
              }}
              sx={{ alignSelf: 'center', fontSize: '0.875rem', py: 1 }}
            >
              {t('open_in_new_tab') || 'Open in new tab'}
            </MuiButton>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ py: 1.5, px: 2 }}>
        <MuiButton onClick={handleClose} size="small" sx={{ fontSize: '0.875rem' }}>
          {t('close') || 'Close'}
        </MuiButton>
      </DialogActions>
      {!loading && previewUrl && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert severity="info" icon={<FileText size={16} />} sx={{ fontSize: '0.8rem' }}>
            {useFiledDoc
              ? (t('filed_document_info') || 'Filed document from Smart Drive')
              : (t('live_preview_info') || 'Live preview generated from current attendance data')}
          </Alert>
        </Box>
      )}
    </Dialog>
  );
}
