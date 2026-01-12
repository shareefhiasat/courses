import React from 'react';

/*
Props:
- categories: Array<{ id: string, label: string, items: Array<{ key: string, label: string, icon?: ReactNode }> }>
- activeCategory: string
- activeItem: string
- onChange: ({ category, item }) => void
- className?: string
*/
export default function RibbonTabs({ categories = [], activeCategory, activeItem, onChange, className = '' }) {
  const cat = categories.find(c => c.id === activeCategory) || categories[0] || { items: [] };

  return (
    <div className={className} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '1rem', background: '#f8f9fa', padding: '1rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', width: '100%' }}>
      {categories.map(category => (
        <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 1 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '0.5rem' }}>{category.label}</div>
          <div style={{ display: 'flex', gap: 6, padding: '0.25rem', background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flexWrap: 'wrap' }}>
            {category.items.map(item => {
              const isActive = activeItem === item.key;
              return (
                <button
                  key={item.key}
                  className={`tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onChange?.({ category: category.id, item: item.key })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: isActive ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    background: isActive ? 'var(--color-primary, #800020)' : 'white',
                    color: isActive ? 'white' : '#111827',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2',
                    margin: '1px 0'
                  }}
                >
                  {item.icon ? <span style={{ display: 'inline-flex' }}>{item.icon}</span> : null}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
