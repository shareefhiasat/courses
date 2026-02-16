import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SimpleLoading } from '@ui';
import './ThemeContext.css';
import logger from '../utils/logger';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('app_theme') || 'light';
      // Apply immediately to prevent flash
      document.documentElement.setAttribute('data-theme', stored);
      return stored;
    } catch {
      return 'light';
    }
  });
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  useEffect(() => {
    if (isThemeChanging) {
      const timer = setTimeout(() => setIsThemeChanging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isThemeChanging]);

  useEffect(() => {
    logger.log('🎨 [ThemeContext] Theme changed to:', theme);
    setIsThemeChanging(true);
    try {
      localStorage.setItem('app_theme', theme);
      logger.log('💾 [ThemeContext] Saved to localStorage:', theme);
    } catch (e) {
      logger.error('❌ [ThemeContext] Failed to save to localStorage:', e);
    }
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    logger.log('📄 [ThemeContext] Set data-theme attribute to:', theme);
    // Body background for immediate effect
    if (theme === 'light') {
      document.body.style.background = '#ffffff';
      document.body.style.color = '#111';
      logger.log('☀️ [ThemeContext] Applied light mode styles');
    } else {
      document.body.style.background = '#0b1220';
      document.body.style.color = '#fff';
      logger.log('🌙 [ThemeContext] Applied dark mode styles');
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isThemeChanging,
    toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }), [theme, isThemeChanging]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {isThemeChanging && (
        <div className="theme-transition-overlay active">
          <SimpleLoading type="brand" />
        </div>
      )}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
