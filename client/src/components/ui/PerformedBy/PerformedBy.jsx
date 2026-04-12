import React from 'react';
import { UserIcon } from '@utils/icons.jsx';


import { info, error, warn, debug } from '@services/utils/logger.js';export const PerformedBy = ({ 
  performedByName, 
  performedBy, 
  showLabel = false, 
  style = {},
  containerStyle = {},
  iconStyle = {},
  textStyle = {}
}) => {
  const displayName = performedByName || performedBy;
  
  if (!displayName) {
    return null;
  }

  return (
    <div style={{ 
      marginBottom: '0.25rem',
      ...containerStyle
    }}>
      {showLabel && (
        <strong style={{ marginRight: '0.25rem' }}>
          By:
        </strong>
      )}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.25rem',
        padding: '0.25rem',
        background: '#f0f9ff',
        borderRadius: '0.25rem',
        fontSize: '0.7rem',
        ...style
      }}>
        <UserIcon style={{ 
          width: '12px', 
          height: '12px', 
          color: '#0369a1',
          ...iconStyle
        }} />
        <span style={{ 
          color: '#0369a1', 
          fontWeight: 500,
          ...textStyle
        }}>
          {displayName}
        </span>
      </div>
    </div>
  );
};

export default PerformedBy;
