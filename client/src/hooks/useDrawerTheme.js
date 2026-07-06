import { useMemo } from 'react';
import { useTheme } from '@contexts/ThemeContext.jsx';

/**
 * Returns the standard set of theme-aware color variables used by drawer components.
 * Eliminates the duplicated `isDarkMode ? '#...' : '#...'` blocks across drawers.
 *
 * @returns {{ bgColor:string, borderColor:string, textColor:string, mutedColor:string, cardBg:string, isDarkMode:boolean }}
 */
export default function useDrawerTheme() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return useMemo(() => ({
    isDarkMode,
    bgColor: isDarkMode ? '#1f2937' : '#ffffff',
    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
    textColor: isDarkMode ? '#f3f4f6' : '#111827',
    mutedColor: isDarkMode ? '#9ca3af' : '#6b7280',
    cardBg: isDarkMode ? '#374151' : '#f9fafb',
  }), [isDarkMode]);
}
