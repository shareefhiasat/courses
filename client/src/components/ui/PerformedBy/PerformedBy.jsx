import React from 'react';
import { User } from 'lucide-react';
import { getLocalizedUserName } from '@utils/localizedUserName';

export const PerformedBy = ({
  performedByName,
  performedBy,
  user,
  lang = 'en',
  showLabel = false,
  style = {},
  containerStyle = {},
  iconStyle = {},
  textStyle = {}
}) => {
  const displayName = user
    ? getLocalizedUserName(user, lang, performedByName || performedBy)
    : (performedByName || performedBy);

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
        <User size={12} style={{ color: '#0369a1', flexShrink: 0, ...iconStyle }} />
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
