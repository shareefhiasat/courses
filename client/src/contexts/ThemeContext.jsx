import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SimpleLoading } from '@ui';
import './ThemeContext.css';
import logger from '@utils/logger';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('app_theme') || 'light';
      // Apply immediately to prevent flash
      document.documentElement.setAttribute('data-theme', stored);
      // Clear any inline styles that might interfere
      document.body.style.background = '';
      document.body.style.color = '';
      // Add dark mode class if needed
      if (stored === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
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
    logger.log('📄 [ThemeContext] Current data-theme attribute:', document.documentElement.getAttribute('data-theme'));
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
    
    // Remove inline styles to let CSS variables handle theming
    document.body.style.background = '';
    document.body.style.color = '';
    
    // Force dark mode styles if needed
    if (theme === 'dark') {
      logger.log('🌙 [ThemeContext] Applied dark mode');
      // Add dark mode class to body for additional specificity
      document.body.classList.add('dark-mode');
    } else {
      logger.log('☀️ [ThemeContext] Applied light mode');
      // Remove dark mode class
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isThemeChanging,
    toggleTheme: () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      logger.log('🔄 [ThemeContext] Toggling theme from', theme, 'to', newTheme);
      setTheme(newTheme);
    }
  }), [theme, isThemeChanging]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {isThemeChanging && (
        <div className="theme-transition-overlay active">
          <SimpleLoading type="spinner" size="sm" />
        </div>
      )}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
