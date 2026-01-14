import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { adjustColor, normalizeHexColor, DEFAULT_ACCENT } from '../utils/color';

const ColorThemeContext = createContext({
  primaryColor: DEFAULT_ACCENT,
  setPrimaryColor: () => {},
});

export const ColorThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [primaryColor, setPrimaryColor] = useState(() => {
    try {
      const uid = user?.uid;
      if (uid) {
        return localStorage.getItem(`accent_color_${uid}`) || DEFAULT_ACCENT;
      }
      return DEFAULT_ACCENT;
    } catch {
      return DEFAULT_ACCENT;
    }
  });

  // Apply CSS variables for the primary color
  const applyColorVars = (color) => {
    try {
      const root = document.documentElement;
      const normalized = normalizeHexColor(color, DEFAULT_ACCENT);
      root.style.setProperty('--color-primary', normalized);
      root.style.setProperty('--color-primary-light', adjustColor(normalized, 15));
      root.style.setProperty('--color-primary-dark', adjustColor(normalized, -15));
      const hex = normalized.replace('#','');
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
      root.style.setProperty('--input-focus', normalized);
    } catch {}
  };

  // Immediately apply initial color on mount to reduce flash
  useEffect(() => {
    if (user?.uid) {
      const cachedColor = localStorage.getItem(`accent_color_${user.uid}`);
      if (cachedColor) {
        applyColorVars(cachedColor);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    try {
      if (user?.uid) {
        localStorage.setItem(`accent_color_${user.uid}`, primaryColor);
      }
    } catch (e) {
      console.error('Failed to save primary color preference', e);
    }

    // Update CSS variables
    applyColorVars(primaryColor);
  }, [primaryColor, user?.uid]);

  // Listen for color updates from AuthContext
  useEffect(() => {
    const handleColorUpdate = (event) => {
      const { uid, color } = event.detail;
      if (uid === user?.uid && color !== primaryColor) {
        setPrimaryColor(color);
      }
    };

    window.addEventListener('accent-color-updated', handleColorUpdate);
    return () => window.removeEventListener('accent-color-updated', handleColorUpdate);
  }, [user?.uid, primaryColor]);

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
