import { useLang } from '@contexts/LangContext';
import { X, FileImage, FileText, Video, Music, Archive, Calendar, User, Star, Clock, Trash2 } from 'lucide-react';

export default function FilterChips({ activeFilters, onRemoveFilter, onClearAll }) {
  const { t } = useLang();

  const getFilterIcon = (type) => {
    switch (type) {
      case 'type': return FileText;
      case 'date': return Calendar;
      case 'owner': return User;
      case 'status': return Star;
      default: return FileText;
    }
  };

  const getFilterLabel = (filter) => {
    const { type, value } = filter;

    switch (type) {
      case 'type':
        return t(`drive.filter.type.${value}`);
      case 'date':
        return t(`drive.filter.date.${value}`);
      case 'owner':
        return value === 'me' ? t('drive.filter.owner.me') : t('drive.filter.owner.shared');
      case 'status':
        return t(`drive.filter.status.${value}`);
      default:
        return value;
    }
  };

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted, #8d90a0)' }}>
        {t('drive.filters')}:
      </span>

      {activeFilters.map((filter, idx) => {
        const Icon = getFilterIcon(filter.type);

        return (
          <button
            key={`${filter.type}-${filter.value}-${idx}`}
            onClick={() => onRemoveFilter(filter)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(128, 0, 32, 0.1)',
              border: '1px solid var(--color-primary, #800020)',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              color: 'var(--color-primary, #800020)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(128, 0, 32, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(128, 0, 32, 0.1)'}
          >
            <Icon className="w-3.5 h-3.5" />
            {getFilterLabel(filter)}
            <X className="w-3.5 h-3.5 ms-1" />
          </button>
        );
      })}

      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted, #8d90a0)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text, #111827)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #8d90a0)'}
        >
          {t('drive.clearAllFilters')}
        </button>
      )}
    </div>
  );
}
