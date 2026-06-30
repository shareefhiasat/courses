import React from 'react';

const DebugPanel = ({ showDebugBox, debugLogs, onClear, isMobile }) => {
  if (!showDebugBox) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      width: isMobile ? '90vw' : '400px',
      height: '300px',
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '0.5rem',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-family-mono)',
      fontSize: '0.75rem',
      maxWidth: '90vw',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem',
        background: '#333',
        borderBottom: '1px solid #444',
        color: 'white'
      }}>
        <span>🐛 Debug Console</span>
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}
        >
          Clear
        </button>
      </div>
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0.5rem'
      }}>
        {debugLogs.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', marginTop: '1rem' }}>
            No logs yet...
          </div>
        ) : (
          debugLogs.map(log => (
            <div
              key={log.id}
              style={{
                marginBottom: '0.25rem',
                color: log.type === 'error' ? '#ef4444' :
                  log.type === 'warning' ? '#f59e0b' :
                    log.type === 'success' ? '#10b981' : '#d1d5db',
                fontSize: '0.7rem',
                lineHeight: '1.3'
              }}
            >
              <span style={{ color: '#666' }}>[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
