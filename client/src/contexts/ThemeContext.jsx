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
    try {
      localStorage.setItem('app_theme', theme);
    } catch {}
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Body background for immediate effect
    if (theme === 'light') {
      document.body.style.background = '#ffffff';
      document.body.style.color = '#111';
    } else {
      document.body.style.background = '#0b1220';
      document.body.style.color = '#fff';
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
