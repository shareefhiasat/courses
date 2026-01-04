import React from 'react';
import { Languages } from 'lucide-react';
import { Badge } from './ui';

export default function LanguageToggle({ value = 'en', onChange, style, className }) {
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
        <Languages size={12} style={{ marginRight: '0.25rem' }} />
        EN
      </Badge>
      <Badge
        variant={current === 'ar' ? 'solid' : 'outline'}
        color="primary"
        size="small"
        style={{ cursor: 'pointer' }}
        onClick={() => onChange?.('ar')}
      >
        <Languages size={12} style={{ marginRight: '0.25rem' }} />
        AR
      </Badge>
    </div>
  );
}
