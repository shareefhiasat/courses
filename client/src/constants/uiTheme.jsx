import { info, error, warn, debug } from '@services/utils/logger.js';

// Centralized UI Theme System
// Provides consistent theming, colors, and styling utilities across all UI components

// Base Theme Configuration
export const UI_THEMES = {
  light: {
    // Colors
    colors: {
      // Primary colors
      primary: {
        50: '#eff6ff',
        100: '#dbeafe', 
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },
      
      // Semantic colors
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
      },
      
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f'
      },
      
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d'
      },
      
      // Neutral colors
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827'
      }
    },
    
    // Component-specific colors
    components: {
      button: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        outline: '#3b82f6',
        ghost: '#6b7280',
        danger: '#ef4444'
      },
      
      input: {
        border: '#d1d5db',
        background: '#ffffff',
        text: '#111827',
        placeholder: '#9ca3af',
        focus: '#3b82f6',
        error: '#ef4444'
      },
      
      card: {
        background: '#ffffff',
        border: '#e5e7eb',
        shadow: 'rgba(0, 0, 0, 0.1)'
      },
      
      select: {
        background: '#ffffff',
        border: '#d1d5db',
        text: '#111827',
        placeholder: '#9ca3af',
        focus: '#3b82f6'
      }
    }
  },
  
  dark: {
    // Colors
    colors: {
      // Primary colors (adjusted for dark mode)
      primary: {
        50: '#1e3a8a',
        100: '#1e40af',
        200: '#1d4ed8',
        300: '#2563eb',
        400: '#3b82f6',
        500: '#60a5fa',
        600: '#93c5fd',
        700: '#bfdbfe',
        800: '#dbeafe',
        900: '#eff6ff'
      },
      
      // Semantic colors (slightly adjusted for dark mode)
      success: {
        50: '#14532d',
        100: '#166534',
        200: '#15803d',
        300: '#16a34a',
        400: '#22c55e',
        500: '#4ade80',
        600: '#86efac',
        700: '#bbf7d0',
        800: '#dcfce7',
        900: '#f0fdf4'
      },
      
      warning: {
        50: '#78350f',
        100: '#92400e',
        200: '#b45309',
        300: '#d97706',
        400: '#f59e0b',
        500: '#fbbf24',
        600: '#fcd34d',
        700: '#fde68a',
        800: '#fef3c7',
        900: '#fffbeb'
      },
      
      error: {
        50: '#7f1d1d',
        100: '#991b1b',
        200: '#b91c1c',
        300: '#dc2626',
        400: '#ef4444',
        500: '#f87171',
        600: '#fca5a5',
        700: '#fecaca',
        800: '#fee2e2',
        900: '#fef2f2'
      },
      
      // Neutral colors (inverted for dark mode)
      gray: {
        50: '#111827',
        100: '#1f2937',
        200: '#374151',
        300: '#4b5563',
        400: '#6b7280',
        500: '#9ca3af',
        600: '#d1d5db',
        700: '#e5e7eb',
        800: '#f3f4f6',
        900: '#f9fafb'
      }
    },
    
    // Component-specific colors
    components: {
      button: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        outline: '#3b82f6',
        ghost: '#9ca3af',
        danger: '#ef4444'
      },
      
      input: {
        border: '#374151',
        background: '#1f2937',
        text: '#f9fafb',
        placeholder: '#9ca3af',
        focus: '#60a5fa',
        error: '#f87171'
      },
      
      card: {
        background: '#1f2937',
        border: '#374151',
        shadow: 'rgba(0, 0, 0, 0.3)'
      },
      
      select: {
        background: '#1f2937',
        border: '#374151',
        text: '#f9fafb',
        placeholder: '#9ca3af',
        focus: '#60a5fa'
      }
    }
  }
};

// Component Size Variants
export const COMPONENT_SIZES = {
  button: {
    small: { padding: '0.375rem 0.75rem', fontSize: '0.875rem', lineHeight: '1.25rem' },
    medium: { padding: '0.5rem 1rem', fontSize: '0.875rem', lineHeight: '1.25rem' },
    large: { padding: '0.75rem 1.5rem', fontSize: '1rem', lineHeight: '1.5rem' }
  },
  
  input: {
    small: { padding: '0.375rem 0.75rem', fontSize: '0.875rem', lineHeight: '1.25rem' },
    medium: { padding: '0.5rem 0.75rem', fontSize: '0.875rem', lineHeight: '1.25rem' },
    large: { padding: '0.75rem 1rem', fontSize: '1rem', lineHeight: '1.5rem' }
  },
  
  select: {
    small: { padding: '0.375rem 0.75rem', fontSize: '0.875rem', lineHeight: '1.25rem' },
    medium: { padding: '0.5rem 0.75rem', fontSize: '0.875rem', lineHeight: '1.25rem' },
    large: { padding: '0.75rem 1rem', fontSize: '1rem', lineHeight: '1.5rem' }
  },
  
  badge: {
    small: { padding: '0.125rem 0.375rem', fontSize: '0.75rem', lineHeight: '1rem' },
    medium: { padding: '0.25rem 0.5rem', fontSize: '0.75rem', lineHeight: '1rem' },
    large: { padding: '0.375rem 0.625rem', fontSize: '0.875rem', lineHeight: '1.25rem' }
  }
};

// Component Variants
export const COMPONENT_VARIANTS = {
  button: {
    primary: {
      backgroundColor: 'var(--color-primary-500)',
      color: 'white',
      border: 'none',
      '&:hover': {
        backgroundColor: 'var(--color-primary-600)'
      },
      '&:active': {
        backgroundColor: 'var(--color-primary-700)'
      }
    },
    
    secondary: {
      backgroundColor: 'var(--color-gray-500)',
      color: 'white',
      border: 'none',
      '&:hover': {
        backgroundColor: 'var(--color-gray-600)'
      }
    },
    
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary-500)',
      border: '1px solid var(--color-primary-500)',
      '&:hover': {
        backgroundColor: 'var(--color-primary-50)',
        color: 'var(--color-primary-600)'
      }
    },
    
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-gray-500)',
      border: 'none',
      '&:hover': {
        backgroundColor: 'var(--color-gray-100)'
      }
    },
    
    danger: {
      backgroundColor: 'var(--color-error-500)',
      color: 'white',
      border: 'none',
      '&:hover': {
        backgroundColor: 'var(--color-error-600)'
      }
    }
  },
  
  input: {
    default: {
      backgroundColor: 'var(--input-background)',
      color: 'var(--input-text)',
      border: '1px solid var(--input-border)',
      '&:focus': {
        borderColor: 'var(--input-focus)',
        boxShadow: '0 0 0 3px var(--color-primary-100)'
      },
      '&:disabled': {
        backgroundColor: 'var(--color-gray-100)',
        color: 'var(--color-gray-400)',
        cursor: 'not-allowed'
      }
    },
    
    error: {
      borderColor: 'var(--color-error-500)',
      '&:focus': {
        borderColor: 'var(--color-error-500)',
        boxShadow: '0 0 0 3px var(--color-error-100)'
      }
    }
  },
  
  badge: {
    solid: {
      backgroundColor: 'var(--badge-background)',
      color: 'var(--badge-text)'
    },
    
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--badge-background)',
      border: '1px solid var(--badge-background)'
    },
    
    subtle: {
      backgroundColor: 'var(--badge-background)',
      color: 'var(--badge-text)',
      opacity: 0.8
    }
  }
};

// Theme Utility Functions
export const getTheme = (theme = 'light') => {
  return UI_THEMES[theme] || UI_THEMES.light;
};

export const getColor = (theme, colorPath, shade = 500) => {
  const themeData = getTheme(theme);
  const [colorType, colorName] = colorPath.split('.');
  
  if (themeData.colors[colorName]) {
    return themeData.colors[colorName][shade];
  }
  
  if (themeData.components[colorType] && themeData.components[colorType][colorName]) {
    return themeData.components[colorType][colorName];
  }
  
  return colorPath;
};

export const getComponentStyles = (theme, component, variant = 'default', size = 'medium') => {
  const themeData = getTheme(theme);
  const variantStyles = COMPONENT_VARIANTS[component]?.[variant] || {};
  const sizeStyles = COMPONENT_SIZES[component]?.[size] || {};
  
  return {
    ...variantStyles,
    ...sizeStyles
  };
};

// CSS Custom Properties Generator
export const generateCSSVariables = (theme = 'light') => {
  const themeData = getTheme(theme);
  const variables = {};
  
  // Generate color variables
  Object.entries(themeData.colors).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      variables[`--color-${colorName}-${shade}`] = value;
    });
  });
  
  // Generate component variables
  Object.entries(themeData.components).forEach(([component, properties]) => {
    Object.entries(properties).forEach(([prop, value]) => {
      variables[`--${component}-${prop}`] = value;
    });
  });
  
  return variables;
};

// Dark Mode Detection
export const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// Theme Application Hook (for React components)
export const useUITheme = (theme) => {
  const resolvedTheme = theme || (isDarkMode() ? 'dark' : 'light');
  const themeData = getTheme(resolvedTheme);
  
  return {
    theme: resolvedTheme,
    colors: themeData.colors,
    components: themeData.components,
    getColor: (colorPath, shade) => getColor(resolvedTheme, colorPath, shade),
    getComponentStyles: (component, variant, size) => 
      getComponentStyles(resolvedTheme, component, variant, size),
    cssVariables: generateCSSVariables(resolvedTheme)
  };
};

export default UI_THEMES;
