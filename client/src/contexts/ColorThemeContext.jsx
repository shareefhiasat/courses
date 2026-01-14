import React, { createContext, useContext, useEffect, useState } from 'react';
import { adjustColor } from '../utils/colorHelpers';

const ColorThemeContext = createContext({
  primaryColor: '#800020', // Default blue-500
  setPrimaryColor: () => {},
});

export const ColorThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(() => {
    try {
      return localStorage.getItem('primaryColor') || '#800020';
    } catch {
      return '#800020';
    }
  });

  // Helper: ensure initial color is applied on mount to avoid flash (robust approach)
  // This is placed before effects to guarantee CSS vars exist early
  const applyInitialColorVars = () => {
    try {
      const root = document.documentElement;
      const color = localStorage.getItem('primaryColor') || '#800020';
      root.style.setProperty('--color-primary', color);
      root.style.setProperty('--color-primary-light', adjustColor(color, 20));
      root.style.setProperty('--color-primary-dark', adjustColor(color, -20));
      const hex = color.replace('#','');
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
    } catch {
      // ignore
    }
  };

  // Immediately apply initial color on mount to reduce flash (guarded)
  useEffect(() => {
    applyInitialColorVars();
  // run only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: ensure initial color is applied on mount to avoid flash (robust approach)
  useEffect(() => {
    try {
      const root = document.documentElement;
      const color = localStorage.getItem('primaryColor') || '#800020';
      root.style.setProperty('--color-primary', color);
      root.style.setProperty('--color-primary-light', adjustColor(color, 20));
      root.style.setProperty('--color-primary-dark', adjustColor(color, -20));
      const hex = color.replace('#','');
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
    } catch {}
  // run only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('primaryColor', primaryColor);
    } catch (e) {
      console.error('Failed to save primary color preference', e);
    }

    // Update CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-500', primaryColor);
    
    // Calculate and set hover and active states
    const hoverColor = adjustColor(primaryColor, 20);
    const activeColor = adjustColor(primaryColor, -10);
    
    root.style.setProperty('--primary-600', hoverColor);
    root.style.setProperty('--primary-700', activeColor);
  }, [primaryColor]);

  // Helper function to adjust color brightness
  const adjustColor = (color, amount) => {
    // Convert hex to RGB
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Additional safeguard: apply initial color on mount to reduce flash before login/profile color load
  useEffect(() => {
    try {
      const root = document.documentElement;
      const color = (typeof localStorage !== 'undefined' ? localStorage.getItem('primaryColor') : null) || '#800020';
      root.style.setProperty('--color-primary', color);
      root.style.setProperty('--color-primary-light', adjustColor(color, 20));
      root.style.setProperty('--color-primary-dark', adjustColor(color, -20));
      const hex = color.replace('#','');
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
    } catch {}
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ColorThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => useContext(ColorThemeContext);
