import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    console.log('🎨 [ThemeContext] Theme changed to:', theme);
    try {
      localStorage.setItem('app_theme', theme);
      console.log('💾 [ThemeContext] Saved to localStorage:', theme);
    } catch (e) {
      console.error('❌ [ThemeContext] Failed to save to localStorage:', e);
    }
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    console.log('📄 [ThemeContext] Set data-theme attribute to:', theme);
    // Body background for immediate effect
    if (theme === 'light') {
      document.body.style.background = '#ffffff';
      document.body.style.color = '#111';
      console.log('☀️ [ThemeContext] Applied light mode styles');
    } else {
      document.body.style.background = '#0b1220';
      document.body.style.color = '#fff';
      console.log('🌙 [ThemeContext] Applied dark mode styles');
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
