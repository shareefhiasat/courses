import React from 'react';
import { createRoot } from 'react-dom/client';
import './tailwind.css';
import './styles/tokens.css';
import './index.css';
import './styles/military-theme.css';
import App from './App.jsx';
import { ToastProvider } from '@ui';
import { info, error, warn, debug } from './services/utils/logger.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

