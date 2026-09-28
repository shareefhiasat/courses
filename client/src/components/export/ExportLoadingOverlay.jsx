import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import { keyframes } from '@mui/system';
import { useLang } from '@contexts/LangContext';
import SimpleLoading from '@components/ui/SimpleLoading/SimpleLoading.jsx';

const dotPulse = keyframes`
  0%, 80%, 100% { opacity: 0.15; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

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

  // Strip a trailing ellipsis so the animated dots don't double up.
  const baseMessage = (message || '').replace(/\.{3,}\s*$/, '');

  return (
    <Dialog
      open={count > 0}
      disableEscapeKeyDown
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          textAlign: 'center',
          overflow: 'hidden',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 34, 0.82)'
              : 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
          border: (theme) =>
            `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
        },
      }}
    >
      {/* thin indeterminate progress bar along the top */}
      <LinearProgress
        sx={{
          height: 3,
          bgcolor: 'transparent',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #6366f1, #0ea5e9, #22c55e)',
          },
        }}
      />
      <DialogContent sx={{ py: 4.5, px: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2.5,
            animation: `${fadeUp} 0.35s ease-out`,
          }}
        >
          <SimpleLoading type="brand" size="lg" />
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              letterSpacing: 0.2,
              color: (theme) => theme.palette.text.primary,
            }}
          >
            {baseMessage}
            <Box component="span" sx={{ display: 'inline-flex', ml: 0.25 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  component="span"
                  sx={{
                    animation: `${dotPulse} 1.2s ease-in-out ${i * 0.18}s infinite`,
                  }}
                >
                  .
                </Box>
              ))}
            </Box>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
