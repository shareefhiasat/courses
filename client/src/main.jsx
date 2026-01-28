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

// PostHog configuration with toolbar enabled
const posthogEnabled = import.meta.env.VITE_POSTHOG_ENABLED !== 'false'; // Default to enabled unless explicitly disabled
const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,
  session_recording: {
    recordCrossOriginIframes: true,
  },
  // Enable toolbar for development
  debug: import.meta.env.VITE_POSTHOG_DEBUG === 'true',
  // Enable toolbar
  toolbar: {
    instrument: true,
  },
  // Enable session replay
  session_replay: {
    recordCrossOriginIframes: true,
  },
};

// Log PostHog status
if (!posthogEnabled) {
  console.log('🔧 PostHog disabled via VITE_POSTHOG_ENABLED=false');
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {posthogEnabled ? (
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY || 'phc_2koOFuF9DP6RWeK9hyFo092OIPRaO3XSECil77mzeFp'}
        options={posthogOptions}
      >
        <ToastProvider>
          <App />
        </ToastProvider>
      </PostHogProvider>
    ) : (
      <ToastProvider>
        <App />
      </ToastProvider>
    )}
  </React.StrictMode>
);
