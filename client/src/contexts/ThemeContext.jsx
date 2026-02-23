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
      // Set proper body background based on theme
      if (stored === 'dark') {
        document.body.style.background = '#0f1115';
        document.body.style.color = '#e6e6e6';
        document.body.classList.add('dark-mode');
      } else {
        document.body.style.background = '#f5f6fa';
        document.body.style.color = '#212529';
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
    
    // Set proper body background based on theme
    if (theme === 'dark') {
      logger.log('🌙 [ThemeContext] Applied dark mode');
      document.body.style.background = '#0f1115';
      document.body.style.color = '#e6e6e6';
      // Add dark mode class to body for additional specificity
      document.body.classList.add('dark-mode');
    } else {
      logger.log('☀️ [ThemeContext] Applied light mode');
      document.body.style.background = '#f5f6fa';
      document.body.style.color = '#212529';
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
