import { useState, useRef, useEffect } from 'react';
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

/**
 * FilterMenu - Dropdown menu for adding filters
 * Categories: File Type, Date Range, Owner, Status
 */
export default function FilterMenu({ onAddFilter }) {
  const { t, isRTL } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveCategory(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const categories = [
    {
      id: 'type',
      label: t('drive.filter.fileType'),
      icon: 'file_text',
      options: [
        { value: 'image', label: t('drive.filter.type.images'), icon: 'image' },
        { value: 'spreadsheet', label: t('drive.filter.type.spreadsheets'), icon: 'table' },
        { value: 'presentation', label: t('drive.filter.type.presentations'), icon: 'presentation' },
        { value: 'document', label: t('drive.filter.type.documents'), icon: 'file_text' },
        { value: 'video', label: t('drive.filter.type.videos'), icon: 'video' },
        { value: 'audio', label: t('drive.filter.type.audio'), icon: 'music' },
        { value: 'archive', label: t('drive.filter.type.archives'), icon: 'archive' },
        { value: 'has-workflow', label: t('drive.filter.type.hasWorkflow'), icon: 'workflow', color: '#8b5cf6' },
      ],
    },
    {
      id: 'date',
      label: t('drive.filter.dateRange'),
      icon: 'calendar',
      options: [
        { value: 'today', label: t('drive.filter.date.today') },
        { value: 'week', label: t('drive.filter.date.week') },
        { value: 'month', label: t('drive.filter.date.month') },
        { value: 'year', label: t('drive.filter.date.year') },
      ],
    },
    {
      id: 'owner',
      label: t('drive.filter.owner'),
      icon: 'user',
      options: [
        { value: 'me', label: t('drive.filter.owner.me') },
        { value: 'shared', label: t('drive.filter.owner.shared') },
      ],
    },
    {
      id: 'status',
      label: t('drive.filter.status'),
      icon: 'star',
      options: [
        { value: 'starred', label: t('drive.filter.status.starred'), icon: 'star' },
        { value: 'recent', label: t('drive.filter.status.recent'), icon: 'clock' },
        { value: 'trash', label: t('drive.filter.status.trash'), icon: 'trash2' },
      ],
    },
  ];

  const handleAddFilter = (type, value) => {
    onAddFilter({ type, value });
    setIsOpen(false);
    setActiveCategory(null);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.3rem 0.65rem',
          background: 'var(--background-secondary, #f3f4f6)',
          color: 'var(--text-secondary, #374151)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: '999px',
          fontSize: '0.8125rem',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {getThemedIcon('ui', 'filter', 14, 'light')}
        {t('drive.addFilter')}
        {getThemedIcon('ui', 'chevron_down', 14, 'light', { style: { transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' } })}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 start-0 w-80 bg-[var(--panel,#191b23)] border border-[var(--border,#434655)]/30 rounded-lg shadow-2xl z-50 overflow-hidden">
          {!activeCategory ? (
            // Category List
            <div className="p-2">
              {categories.map((category) => {
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text, inherit)',
                      cursor: 'pointer',
                      textAlign: 'start',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background-secondary, #32343d)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {getThemedIcon('ui', category.icon, 18, 'primary')}
                      <span className="text-sm">{category.label}</span>
                    </div>
                    {getThemedIcon('ui', 'chevron_right', 16, 'muted', { style: { transform: isRTL ? 'scaleX(-1)' : 'none' } })}
                  </button>
                );
              })}
            </div>
          ) : (
            // Options List
            <div className="p-2">
              <button
                onClick={() => setActiveCategory(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  marginBottom: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted, #8d90a0)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text, inherit)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #8d90a0)'}
              >
                {getThemedIcon('ui', 'chevron_left', 16, 'muted', { style: { transform: isRTL ? 'scaleX(-1)' : 'none' } })}
                {t('common.back')}
              </button>

              {categories
                .find((c) => c.id === activeCategory)
                ?.options.map((option) => {
                  const optionIcon = option.icon || 'file_text';
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAddFilter(activeCategory, option.value)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text, inherit)',
                        cursor: 'pointer',
                        textAlign: 'start',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background-secondary, #32343d)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {getThemedIcon('ui', optionIcon, 18, 'primary')}
                      <span className="text-sm">{option.label}</span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
