import { info, error, warn, debug } from '@services/utils/logger.js';

// Version and build information using environment variables
// Falls back to defaults if env vars are not set
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const BUILD_DATE = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();
export const BUILD_TIMESTAMP = new Date(BUILD_DATE).getTime();

// Helper to format version display
export const formatVersionInfo = () => {
  const date = new Date(BUILD_DATE);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  return `v${APP_VERSION} - ${formattedDate}`;
};
