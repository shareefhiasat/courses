import React, { createContext, useContext, useEffect, useState } from 'react';

const ColorThemeContext = createContext({
  primaryColor: '#3b82f6', // Default blue-500
  setPrimaryColor: () => {},
});

export const ColorThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(() => {
    try {
      return localStorage.getItem('primaryColor') || '#3b82f6';
    } catch {
      return '#3b82f6';
    }
  });

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

  return (
    <ColorThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => useContext(ColorThemeContext);
