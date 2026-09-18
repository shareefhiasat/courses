import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useLang } from '@contexts/LangContext';

export default function ExportLoadingOverlay() {
  const { t } = useLang();
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onStart = (e) => {
      setCount((c) => c + 1);
      const detailMessage = e?.detail?.message;
      setMessage(detailMessage || t('generating_report', 'Generating report...'));
    };

    const onEnd = () => {
      setCount((c) => Math.max(0, c - 1));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('export-loading-start', onStart);
      window.addEventListener('export-loading-end', onEnd);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('export-loading-start', onStart);
        window.removeEventListener('export-loading-end', onEnd);
      }
    };
  }, [t]);

  useEffect(() => {
    if (count === 0) {
      setMessage('');
    }
  }, [count]);

  return (
    <Dialog
      open={count > 0}
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 2,
          textAlign: 'center',
          overflow: 'hidden',
        },
      }}
    >
      <DialogContent sx={{ py: 4, px: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress color="primary" size={48} />
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: (theme) => theme.palette.text.primary,
            }}
          >
            {message}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
