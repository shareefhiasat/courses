import React from 'react';
import { getThemedIcon, getIconWithColor } from '@constants/iconTypes';
import { Badge } from '@ui';


import { info, error, warn, debug } from '@services/utils/logger.js';export default function LanguageToggle({ value = 'en', onChange, style, className }) {
  const current = value === 'ar' ? 'ar' : 'en';

  return (
    <div className={className} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', ...style }}>
      <Badge
        variant={current === 'en' ? 'solid' : 'outline'}
        color="primary"
        size="small"
        style={{ cursor: 'pointer' }}
        onClick={() => onChange?.('en')}
      >
        {current === 'en' ? getIconWithColor('ui', 'globe', 12, '#fff') : getThemedIcon('ui', 'globe', 12)}
        EN
      </Badge>
      <Badge
        variant={current === 'ar' ? 'solid' : 'outline'}
        color="primary"
        size="small"
        style={{ cursor: 'pointer' }}
        onClick={() => onChange?.('ar')}
      >
        {current === 'ar' ? getIconWithColor('ui', 'globe', 12, '#fff') : getThemedIcon('ui', 'globe', 12)}
        AR
      </Badge>
    </div>
  );
}
