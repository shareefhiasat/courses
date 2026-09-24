import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './tailwind.css';
import './styles/tokens.css';
import './styles/type-bridge.css';
import './index.css';
import './styles/military-theme.css';
import App from './App.jsx';
import { Toaster } from 'sonner';
import { ToastProvider } from '@ui';
import { applyTypographyVars, readTypographyFromStorage, applyTextSize, readTextSizeFromStorage } from './utils/typography.js';

const bootFonts = readTypographyFromStorage(null);
applyTypographyVars(bootFonts.fontLtr, bootFonts.fontRtl);
applyTextSize(readTextSizeFromStorage(null));

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
      <Toaster
        position="bottom-center"
        closeButton
        toastOptions={{
          style: {
            borderRadius: '8px',
            fontSize: '0.8125rem',
          },
        }}
      />
    </ToastProvider>
  </React.StrictMode>
);
