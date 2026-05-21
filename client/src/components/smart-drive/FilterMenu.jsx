import { useState, useRef, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { Filter, FileImage, FileText, Video, Music, Archive, Calendar, User, Star, Clock, Trash2, ChevronDown } from 'lucide-react';

/**
 * FilterMenu - Dropdown menu for adding filters
 * Categories: File Type, Date Range, Owner, Status
 */
export default function FilterMenu({ onAddFilter }) {
  const { t } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
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
      icon: FileText,
      options: [
        { value: 'images', label: t('drive.filter.type.images'), icon: FileImage },
        { value: 'documents', label: t('drive.filter.type.documents'), icon: FileText },
        { value: 'videos', label: t('drive.filter.type.videos'), icon: Video },
        { value: 'audio', label: t('drive.filter.type.audio'), icon: Music },
        { value: 'archives', label: t('drive.filter.type.archives'), icon: Archive },
      ],
    },
    {
      id: 'date',
      label: t('drive.filter.dateRange'),
      icon: Calendar,
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
      icon: User,
      options: [
        { value: 'me', label: t('drive.filter.owner.me') },
        { value: 'shared', label: t('drive.filter.owner.shared') },
      ],
    },
    {
      id: 'status',
      label: t('drive.filter.status'),
      icon: Star,
      options: [
        { value: 'starred', label: t('drive.filter.status.starred'), icon: Star },
        { value: 'recent', label: t('drive.filter.status.recent'), icon: Clock },
        { value: 'trash', label: t('drive.filter.status.trash'), icon: Trash2 },
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
        <Filter className="w-3.5 h-3.5" />
        {t('drive.addFilter')}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 start-0 w-64 bg-[var(--panel,#191b23)] border border-[var(--border,#434655)]/30 rounded-lg shadow-2xl z-50 overflow-hidden">
          {!activeCategory ? (
            // Category List
            <div className="p-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon className="w-4 h-4" style={{ color: 'var(--color-primary, #b4c5ff)' }} />
                      <span className="text-sm">{category.label}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 -rotate-90" style={{ color: 'var(--text-muted, #8d90a0)' }} />
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
                  padding: '0.5rem 0.75rem',
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
                <ChevronDown className="w-4 h-4 rotate-90" />
                {t('common.back')}
              </button>
              
              {categories
                .find((c) => c.id === activeCategory)
                ?.options.map((option) => {
                  const OptionIcon = option.icon || FileText;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAddFilter(activeCategory, option.value)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
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
                      <OptionIcon className="w-4 h-4" style={{ color: 'var(--color-primary, #b4c5ff)' }} />
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
