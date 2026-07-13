import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { FileText, X, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/kibo/ui/button';

function formatGeneratedAt(value) {
  if (!value) return '';
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

/**
 * Inline PDF / file preview for a Smart Drive fileId (workflow attachment)
 * or a direct blobUrl (real-time generated preview).
 */
export default function WorkflowPdfPreviewPanel({
  fileId,
  fileName,
  blobUrl,
  generatedAt,
  isApproved = false,
  externalLoading = false,
  open,
  onClose,
  t,
  compact = false,
}) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      setError(null);
      return undefined;
    }
    if (blobUrl) {
      setPreviewUrl(blobUrl);
      setError(null);
      setLoading(false);
      return undefined;
    }
    if (!fileId && !externalLoading) {
      setPreviewUrl(null);
      setError(null);
      return undefined;
    }
    if (!fileId && externalLoading) {
      setPreviewUrl(null);
      setError(null);
      setLoading(true);
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
  }, [open, fileId, blobUrl, externalLoading, t]);

  if (!open) return null;

  if (!fileId && !blobUrl && !externalLoading) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('operations_board_preview_no_file') || 'No PDF attached to this workflow yet.'}
        </Typography>
      </Box>
    );
  }

  const headerIcon = isApproved
    ? <ShieldCheck size={18} style={{ color: '#16a34a' }} />
    : <FileText size={18} color="#6b7280" />;

  return (
    <Box
      className="operations-board-pdf-preview"
      data-testid="operations-board-pdf-preview"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        border: '1px solid',
        borderColor: isApproved ? '#16a34a' : 'divider',
        borderRadius: 1,
        p: compact ? 1 : 1.5,
        bgcolor: 'background.paper',
        minHeight: compact ? 280 : 420,
        flex: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {headerIcon}
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
            aria-label={t('operations_board_view_file') || 'Open in new tab'}
          >
            <ExternalLink size={16} />
          </IconButton>
        )}
        {onClose && (
          <IconButton size="small" onClick={onClose} aria-label={t('close') || 'Close'} data-testid="operations-board-pdf-preview-close">
            <X size={16} />
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
          {fileId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/smart-drive?fileId=${fileId}`, '_blank')}
            >
              {t('operations_board_view_file') || 'View in Smart Drive'}
            </Button>
          )}
        </Box>
      )}
      {!loading && previewUrl && (
        <Box sx={{ flex: 1, minHeight: compact ? 220 : 360 }}>
          <iframe
            title={fileName || 'PDF preview'}
            src={previewUrl}
            style={{
              width: '100%',
              height: '100%',
              minHeight: compact ? 220 : 360,
              border: 'none',
              borderRadius: 4,
            }}
          />
        </Box>
      )}
      {generatedAt && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Clock size={12} className="text-muted-foreground" />
          <Typography variant="caption" color="text.secondary">
            {t('operations_board_generated_at') || 'Generated'}: {formatGeneratedAt(generatedAt)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
