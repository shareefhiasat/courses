import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';

const ClassHistorySearchInput = ({ value, onChange, placeholder }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        padding: '6px 10px',
        borderRadius: '8px',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
      }}
    >
      {getThemedIcon('ui', 'search', 18, theme)}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontSize: '16px',
          color: isDark ? '#f1f5f9' : '#1e293b',
        }}
      />
    </div>
  );
};

export default ClassHistorySearchInput;
