import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { adjustColor, normalizeHexColor, DEFAULT_ACCENT } from '../utils/color';
import { info, error, warn, debug } from '@services/utils/logger.js';

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
      
      // Try to find most recent accent color from any user for login pages
      let color = DEFAULT_ACCENT;
      let foundKey = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('accent_color_')) {
          const storedColor = localStorage.getItem(key);
          if (storedColor) {
            color = storedColor;
            foundKey = key;
          }
        }
      }
      // info('🎨 [ColorTheme] Initial state - found accent color:', foundKey, color);
      return color;
    } catch {
      return DEFAULT_ACCENT;
    }
  });

  // Apply CSS variables for the primary color
  const applyColorVars = useCallback((color) => {
    // info('🎨 [ColorTheme] Applying color vars:', { color, source: 'applyColorVars' });
    try {
      const root = document.documentElement;
      const normalized = normalizeHexColor(color, DEFAULT_ACCENT);
      // info('🎨 [ColorTheme] Normalized color:', normalized);
      
      root.style.setProperty('--color-primary', normalized);
      root.style.setProperty('--color-primary-light', adjustColor(normalized, 15));
      root.style.setProperty('--color-primary-dark', adjustColor(normalized, -15));
      
      // Properly calculate RGB values
      const hex = normalized.replace('#','');
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      const rgbString = `${r}, ${g}, ${b}`;
      // info('🎨 [ColorTheme] RGB values:', { r, g, b, rgbString });
      
      root.style.setProperty('--color-primary-rgb', rgbString);
      root.style.setProperty('--input-focus', normalized);
      
      // Also update the brand variable to ensure consistency
      root.style.setProperty('--brand', normalized);
      root.style.setProperty('--brand2', adjustColor(normalized, 15));
      
      // Log all applied variables for debugging
      // console.log('🎨 [ColorTheme] Applied CSS variables:', {
      //   '--color-primary': root.style.getPropertyValue('--color-primary'),
      //   '--color-primary-light': root.style.getPropertyValue('--color-primary-light'),
      //   '--color-primary-dark': root.style.getPropertyValue('--color-primary-dark'),
      //   '--color-primary-rgb': root.style.getPropertyValue('--color-primary-rgb'),
      //   '--brand': root.style.getPropertyValue('--brand'),
      //   '--brand2': root.style.getPropertyValue('--brand2')
      // });
      
      // Auto-debug in development
      if (import.meta.env.MODE === 'development' && window.debugThemeVariables) {
        setTimeout(() => {
          // info('🎨 [ColorTheme] Running automatic debug after color application...');
          window.debugThemeVariables();
        }, 100);
      }
    } catch (error) {
      error('🎨 [ColorTheme] Failed to apply color variables:', error);
    }
  }, []);

  // Immediately apply initial color on mount to reduce flash
  useEffect(() => {
    // info('🎨 [ColorTheme] Initial mount effect:', { user: user?.uid });
    if (user?.uid) {
      const cachedColor = localStorage.getItem(`accent_color_${user.uid}`);
      // info('🎨 [ColorTheme] Cached color from localStorage:', cachedColor);
      if (cachedColor) {
        applyColorVars(cachedColor);
      } else {
        // info('🎨 [ColorTheme] No cached color found, using default');
      }
    }
  }, [user?.uid, applyColorVars]);

  useEffect(() => {
    // info('🎨 [ColorTheme] Color change effect:', { primaryColor, user: user?.uid });
    try {
      if (user?.uid) {
        localStorage.setItem(`accent_color_${user.uid}`, primaryColor);
        // info('🎨 [ColorTheme] Saved to localStorage:', `accent_color_${user.uid}=${primaryColor}`);
      }
    } catch (e) {
      error('🎨 [ColorTheme] Failed to save primary color preference:', e);
    }

    // Update CSS variables
    applyColorVars(primaryColor);
  }, [primaryColor, user?.uid, applyColorVars]);

  // Listen for color updates from AuthContext
  useEffect(() => {
    const handleColorUpdate = (event) => {
      const { uid, color } = event.detail;
      // info('🎨 [ColorTheme] Cross-tab color update received:', { uid, color, currentUid: user?.uid, currentColor: primaryColor });
      if (uid === user?.uid && color !== primaryColor) {
        // info('🎨 [ColorTheme] Applying cross-tab color update');
        setPrimaryColor(color);
      } else {
        // console.log('🎨 [ColorTheme] Ignoring cross-tab update (uid mismatch or same color)');
      }
    };

    window.addEventListener('accent-color-updated', handleColorUpdate);
    return () => {
      // info('🎨 [ColorTheme] Cleaning up cross-tab listener');
      window.removeEventListener('accent-color-updated', handleColorUpdate);
    };
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
    // info('🎨 [ColorTheme] Initial safeguard effect running');
    try {
      const root = document.documentElement;
      
      // Try to find the most recent accent color from any user
      let color = '#800020'; // default
      let foundKey = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // console.log('🎨 [ColorTheme] Checking localStorage key:', key);
        if (key && key.startsWith('accent_color_')) {
          const storedColor = localStorage.getItem(key);
          if (storedColor) {
            color = storedColor;
            foundKey = key;
            // info('🎨 [ColorTheme] Found stored accent color:', key, storedColor);
          }
        }
      }
      
      // Fallback to primaryColor if no accent colors found
      if (color === '#800020') {
        const fallbackColor = localStorage.getItem('primaryColor');
        if (fallbackColor) {
          color = fallbackColor;
          // info('🎨 [ColorTheme] Using fallback primaryColor:', fallbackColor);
        }
      }
      
      // info('🎨 [ColorTheme] Final safeguard color:', color);
      // info('🎨 [ColorTheme] All localStorage keys:', Array.from({length: localStorage.length}, (_, i) => localStorage.key(i)));
      
      root.style.setProperty('--color-primary', color);
      root.style.setProperty('--color-primary-light', adjustColor(color, 20));
      root.style.setProperty('--color-primary-dark', adjustColor(color, -20));
      const hex = color.replace('#','');
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
      
      // Also update brand variables for consistency
      root.style.setProperty('--brand', color);
      root.style.setProperty('--brand2', adjustColor(color, 20));
      
      // console.log('🎨 [ColorTheme] Safeguard applied variables:', {
      //   '--color-primary': root.style.getPropertyValue('--color-primary'),
      //   '--brand': root.style.getPropertyValue('--brand'),
      //   '--brand2': root.style.getPropertyValue('--brand2')
      // });
    } catch (error) {
      error('🎨 [ColorTheme] Failed to apply initial color variables:', error);
    }
  // Run once on mount
   
  }, []);

  return (
    <ColorThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => useContext(ColorThemeContext);
