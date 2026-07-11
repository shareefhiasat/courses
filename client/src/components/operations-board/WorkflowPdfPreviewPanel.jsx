import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { FileText, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/kibo/ui/button';

/**
 * Inline PDF / file preview for a Smart Drive fileId (workflow attachment).
 */
export default function WorkflowPdfPreviewPanel({
  fileId,
  fileName,
  open,
  onClose,
  t,
  compact = false,
}) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !fileId) {
      setPreviewUrl(null);
      setError(null);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('keycloak_token');
        const response = await fetch(`/api/v1/drive/files/${fileId}/preview`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        const data = await response.json();
        if (cancelled) return;
        if (data.success && data.payload?.url) {
          setPreviewUrl(data.payload.url);
        } else {
          setError(data.error?.message || data.error || (t('operations_board_preview_failed') || 'Preview unavailable'));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || (t('operations_board_preview_failed') || 'Preview unavailable'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, fileId, t]);

  if (!open || !fileId) return null;

  return (
    <Box
      className="operations-board-pdf-preview"
      data-testid="operations-board-pdf-preview"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: compact ? 1 : 1.5,
        bgcolor: 'background.paper',
        minHeight: compact ? 280 : 420,
        flex: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FileText size={16} color="#3b82f6" />
        <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }} noWrap>
          {fileName || (t('operations_board_preview_pdf') || 'Preview PDF')}
        </Typography>
        {previewUrl && (
          <IconButton
            size="small"
            component="a"
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('operations_board_view_file') || 'Open'}
          >
            <ExternalLink size={14} />
          </IconButton>
        )}
        {onClose && (
          <IconButton size="small" onClick={onClose} aria-label={t('close') || 'Close'} data-testid="operations-board-pdf-preview-close">
            <X size={14} />
          </IconButton>
        )}
      </Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {!loading && error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 2 }}>
          <Typography variant="body2" color="error">{error}</Typography>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/smart-drive?fileId=${fileId}`, '_blank')}
          >
            {t('operations_board_view_file') || 'View in Smart Drive'}
          </Button>
        </Box>
      )}
      {!loading && previewUrl && (
        <Box sx={{ flex: 1, minHeight: compact ? 220 : 360 }}>
          <iframe
            title={fileName || 'PDF preview'}
            src={previewUrl}
            style={{ width: '100%', height: '100%', minHeight: compact ? 220 : 360, border: 'none', borderRadius: 4 }}
          />
        </Box>
      )}
    </Box>
  );
}
