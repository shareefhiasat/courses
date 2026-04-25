import { useLang } from '@contexts/LangContext';
import { X, FileImage, FileText, Video, Music, Archive, Calendar, User, Star, Clock, Trash2 } from 'lucide-react';

/**
 * FilterChips - Interactive filter chips with remove buttons
 * Synced with URL query params for shareable filtered views
 */
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
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-[#8d90a0]">
        {t('drive.filters')}:
      </span>
      
      {activeFilters.map((filter, idx) => {
        const Icon = getFilterIcon(filter.type);
        
        return (
          <button
            key={`${filter.type}-${filter.value}-${idx}`}
            onClick={() => onRemoveFilter(filter)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb]/10 border border-[#2563eb]/30 rounded-full text-sm text-[#b4c5ff] hover:bg-[#2563eb]/20 transition-colors"
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
          className="text-sm text-[#8d90a0] hover:text-white underline"
        >
          {t('drive.clearAllFilters')}
        </button>
      )}
    </div>
  );
}
