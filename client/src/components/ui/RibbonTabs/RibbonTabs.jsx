import React, { useState, useCallback } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { Tooltip, PortalTooltip, Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';

const STORAGE_KEY = 'ribbonTabsCollapsed';

function loadCollapsedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCollapsedState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

/*
Props:
- categories: Array<{ id: string, label: string, items: Array<{ key: string, label: string, icon?: ReactNode }> }>
- activeCategory: string
- activeItem: string
- onChange: ({ category, item }) => void
- className?: string
*/
export default function RibbonTabs({ categories = [], activeCategory, activeItem, onChange, className = '' }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDarkMode = theme === 'dark';

  const [collapsed, setCollapsed] = useState(loadCollapsedState);

  const toggleCategory = useCallback((categoryId) => {
    setCollapsed(prev => {
      const next = { ...prev, [categoryId]: !prev[categoryId] };
      saveCollapsedState(next);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allExpanded = {};
    categories.forEach(cat => { allExpanded[cat.id] = false; });
    setCollapsed(allExpanded);
    saveCollapsedState(allExpanded);
  }, [categories]);

  const collapseAll = useCallback(() => {
    const allCollapsed = {};
    categories.forEach(cat => { allCollapsed[cat.id] = true; });
    setCollapsed(allCollapsed);
    saveCollapsedState(allCollapsed);
  }, [categories]);

  // Auto-expand the category containing the active item
  React.useEffect(() => {
    const activeCat = categories.find(cat => cat.items.some(item => item.key === activeItem));
    if (activeCat && collapsed[activeCat.id]) {
      setCollapsed(prev => {
        const next = { ...prev, [activeCat.id]: false };
        saveCollapsedState(next);
        return next;
      });
    }
  }, [activeItem, categories, collapsed]);

  // Tab key to URL mapping for open in separate page functionality
  const tabKeyToUrl = {
    'activities': '/activities',
    'announcements': '/announcements', 
    'resources': '/resources',
    'users': '/users',
    'allowlist': '/allowlist',
    'emailTemplates': '/email-templates',
    'notificationLogs': '/notification-logs',
    'scheduled-reports': '/scheduled-reports',
    'programs': '/programs',
    'subjects': '/subjects',
    'classes': '/classes',
    'enrollments': '/enrollments',
    'manage-enrollments': '/manage-enrollments',
    'marks': '/marks-entry',
    'classschedule': '/scheduling-calendar?tab=classes',
    'penalty': '/penalty',
    'participation': '/participation',
    'behavior': '/behavior',
    'categories': '/categories',
    'logging': '/logs'
  };

  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem', background: isDarkMode ? '#1f2937' : '#f8f9fa', padding: '1rem', borderRadius: 12, boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '0 0 auto', marginLeft: 'auto', order: 999 }}>
        <button
          onClick={expandAll}
          title={t('expand_all')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '4px', borderRadius: 6, color: isDarkMode ? '#9ca3af' : '#6b7280',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = isDarkMode ? '#374151' : '#e5e7eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {getThemedIcon('ui', 'chevrons_up_down', 16, theme)}
        </button>
        <button
          onClick={collapseAll}
          title={t('collapse_all')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '4px', borderRadius: 6, color: isDarkMode ? '#9ca3af' : '#6b7280',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = isDarkMode ? '#374151' : '#e5e7eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {getThemedIcon('ui', 'chevrons_up', 16, theme)}
        </button>
      </div>
      {categories.map(category => {
        const isCollapsed = collapsed[category.id];
        const hasActiveItem = category.items.some(item => item.key === activeItem);

        return (
        <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 1 auto' }}>
          <button
            onClick={() => toggleCategory(category.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              paddingLeft: '0.5rem',
              padding: 0,
            }}
          >
            {getThemedIcon('ui', isCollapsed ? 'chevron_right' : 'chevron_down', 12)}
            <span>{category.label}</span>
            {isCollapsed && hasActiveItem && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-primary, #10B981)',
                display: 'inline-block',
                marginLeft: 2,
              }} />
            )}
          </button>
          {!isCollapsed && (
          <div style={{ display: 'flex', gap: 6, padding: '0.25rem', background: isDarkMode ? '#111827' : 'white', borderRadius: 10, boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.08)', flexWrap: 'wrap' }}>
            {category.items.map(item => {
              const isActive = activeItem === item.key;
              const tabUrl = tabKeyToUrl[item.key];
              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    className={`tab-btn ${isActive ? 'active' : ''}`}
                    data-tour={`tab-${item.key}`}
                    onClick={() => onChange?.({ category: category.id, item: item.key })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '6px 10px',
                      borderRadius: 6,
                      scrollMarginTop: 88,
                      border: isActive ? '1px solid var(--color-primary, #10B981)' : (isDarkMode ? '1px solid #374151' : '1px solid rgba(0,0,0,0.06)'),
                      background: isActive ? 'var(--color-primary, #10B981)' : (isDarkMode ? '#1f2937' : 'white'),
                      color: isActive ? 'white' : (isDarkMode ? '#f9fafb' : '#111827'),
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.2',
                      margin: '1px 0',
                      boxShadow: isActive ? '0 2px 8px rgba(16, 185, 129, 0.3)' : (isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.08)'),
                      transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {item.icon ? <span style={{ display: 'inline-flex' }}>{item.icon}</span> : null}
                    <span>{item.label}</span>
                  </button>
                  {tabUrl && (
                    <PortalTooltip content={t('open_in_separate_page')} position="top">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(tabUrl, '_blank')}
                        style={{ 
                          padding: '0.25rem',
                          minWidth: 'auto',
                          height: '28px',
                          width: '28px',
                          opacity: 0.8,
                          transition: 'all 0.2s ease',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = '1';
                          e.target.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = '0.8';
                          e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        {getThemedIcon('ui', 'external_link', 14, theme)}
                      </Button>
                    </PortalTooltip>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
