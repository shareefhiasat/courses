import React from 'react';

/*
Props:
- categories: Array<{ key: string, label: string, items: Array<{ key: string, label: string, icon?: ReactNode }> }>
- activeCategory: string
- activeItem: string
- onChange: ({ category, item }) => void
- className?: string
*/
export default function RibbonTabs({ categories = [], activeCategory, activeItem, onChange, className = '' }) {
  const cat = categories.find(c => c.key === activeCategory) || categories[0] || { items: [] };

  return (
    <div className={className} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '1rem', background: '#f8f9fa', padding: '1rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      {categories.map(c => (
        <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '0.5rem' }}>{c.label}</div>
          <div style={{ display: 'flex', gap: 6, padding: '0.25rem', background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {c.items.map(it => {
              const isActive = activeItem === it.key;
              return (
                <button
                  key={it.key}
                  className={`tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onChange?.({ category: c.key, item: it.key })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: isActive ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    background: isActive ? 'var(--color-primary, #800020)' : 'white',
                    color: isActive ? 'white' : '#111827',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13
                  }}
                >
                  {it.icon ? <span style={{ display: 'inline-flex' }}>{it.icon}</span> : null}
                  <span>{it.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
