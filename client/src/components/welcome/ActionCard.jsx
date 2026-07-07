import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';

const ICON_MAP = {
  take_attendance: { category: 'ui', type: 'attendance', size: 48 },
  review_schedule: { category: 'ui', type: 'calendar', size: 48 },
  my_submissions: { category: 'ui', type: 'workflow', size: 48 },
  review_daily: { category: 'ui', type: 'check_circle', size: 48 },
  review_submissions: { category: 'ui', type: 'workflow', size: 48 },
  manage_schedules: { category: 'ui', type: 'calendar', size: 48 },
  audit_attendance: { category: 'ui', type: 'warning', size: 48 },
  review_reports: { category: 'ui', type: 'file', size: 48 },
  manage_users: { category: 'ui', type: 'users', size: 48 },
  system_admin: { category: 'ui', type: 'settings', size: 48 },
};

const ActionCard = ({ card, isPrimary }) => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const iconMeta = ICON_MAP[card.iconKey] || { category: 'ui', type: 'settings', size: 48 };
  const iconEl = getThemedIcon(iconMeta.category, iconMeta.type, iconMeta.size, isDark ? 'dark' : 'light');

  const handleClick = () => {
    if (card.onClick) {
      card.onClick();
    } else if (card.path) {
      navigate(card.path);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`welcome-action-card ${isPrimary ? 'welcome-action-card--primary' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '24px',
        borderRadius: '16px',
        border: isPrimary
          ? `2px solid var(--color-primary, #800020)`
          : `1px solid var(--color-border, #e2e8f0)`,
        background: isDark ? '#1e293b' : '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: lang === 'ar' ? 'right' : 'left',
        minWidth: '220px',
        flex: '1 1 220px',
        maxWidth: '320px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {iconEl}
        {isPrimary && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'var(--color-primary, #800020)',
              color: '#fff',
            }}
          >
            {t('welcome_primary_badge')}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: isDark ? '#f1f5f9' : '#1e293b' }}>
          {lang === 'ar' && card.titleAr ? card.titleAr : card.title}
        </div>
        <div style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>
          {lang === 'ar' && card.descAr ? card.descAr : card.desc}
        </div>
      </div>
    </button>
  );
};

export default ActionCard;
