import React from 'react';
import { createRoot } from 'react-dom/client';
import './tailwind.css';
import './styles/tokens.css';
import './index.css';
import './styles/military-theme.css';
import App from './App.jsx';
import { ToastProvider } from './components/ui';
import { PostHogProvider } from 'posthog-js/react';
import { initSentry } from './config/sentry.js';

// Initialize Sentry for error tracking
initSentry();

// PostHog configuration
const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  session_recording: {
    recordCrossOriginIframes: true,
  },
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY || 'phc_mpxjjYTNPiUTxE12MYkOsbH1DLTsjuOz4EEUOWEkUuc'}
      options={posthogOptions}
    >
      <ToastProvider>
        <App />
      </ToastProvider>
    </PostHogProvider>
  </React.StrictMode>
);
