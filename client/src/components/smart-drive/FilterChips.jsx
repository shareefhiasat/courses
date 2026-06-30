import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';

const FILTER_TYPE_KEY_MAP = {
  image: 'drive.filter.type.images',
  spreadsheet: 'drive.filter.type.spreadsheets',
  presentation: 'drive.filter.type.presentations',
  document: 'drive.filter.type.documents',
  video: 'drive.filter.type.videos',
  audio: 'drive.filter.type.audio',
  archive: 'drive.filter.type.archives',
  'has-workflow': 'drive.filter.type.hasWorkflow',
};

export default function FilterChips({ activeFilters, onRemoveFilter, onClearAll }) {
  const { t } = useLang();

  const getFilterIcon = (type) => {
    switch (type) {
      case 'type': return 'file_text';
      case 'date': return 'calendar';
      case 'owner': return 'user';
      case 'status': return 'star';
      default: return 'file_text';
    }
  };

  const getFilterLabel = (filter) => {
    const { type, value } = filter;

    switch (type) {
      case 'type':
        return t(FILTER_TYPE_KEY_MAP[value] || `drive.filter.type.${value}`);
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
      {activeFilters.map((filter, idx) => {
        const icon = getFilterIcon(filter.type);

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
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-primary, #800020)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(128, 0, 32, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(128, 0, 32, 0.1)'}
          >
            {getThemedIcon('ui', icon, 14, 'light')}
            {getFilterLabel(filter)}
            {getThemedIcon('ui', 'x', 14, 'light')}
          </button>
        );
      })}

      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          title={t('drive.clearAllFilters')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.375rem',
            color: 'var(--text-muted, #8d90a0)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: '0.375rem',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-primary, #800020)';
            e.currentTarget.style.background = 'rgba(128, 0, 32, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted, #8d90a0)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {getThemedIcon('ui', 'trash2', 16, 'light')}
        </button>
      )}
    </div>
  );
}
