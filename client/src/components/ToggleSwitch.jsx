import React from 'react';

const ToggleSwitch = ({ checked, onChange, label, disabled = false }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          background: checked ? 'linear-gradient(135deg, #800020, #600018)' : '#ccc',
          borderRadius: 12,
          transition: 'background 0.3s',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            background: 'white',
            borderRadius: '50%',
            transition: 'left 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      </div>
      {label && <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{label}</span>}
    </label>
  );
};

export default ToggleSwitch;
