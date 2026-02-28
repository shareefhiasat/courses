import React from 'react';
import { formatVersionInfo } from '../../../config/version';
import { useTheme } from '@contexts/ThemeContext';

const VersionDisplay = ({ className = '', style = {} }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div 
      className={`version-display ${className}`}
      style={{
        position: 'fixed',
        bottom: '8px',
        left: '8px',
        fontSize: '10px',
        color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
        background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        zIndex: 1000,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        ...style
      }}
    >
      {formatVersionInfo()}
    </div>
  );
};

export default VersionDisplay;
