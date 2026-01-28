import React from 'react';
import { Award, BookOpen, ClipboardList, HelpCircle, Star, StarOff, Pin, Repeat, CheckCircle, Hourglass } from 'lucide-react';

/**
 * Reusable filter chips component
 * @param {Object} props
 * @param {Array} props.filters - Array of filter configs: { id, label, icon, bg, fg, active, onClick }
 * @param {string} props.variant - 'type' | 'level' | 'status' | 'custom'
 * @param {Function} props.t - Translation function
 */
export default function FilterChips({ filters = [], variant = 'custom', t = (key) => key }) {
  const getDefaultStyles = (filter) => {
    if (variant === 'type') {
      const typeStyles = {
        all: { bg: filter.active ? 'var(--color-primary, #800020)' : '#fff', fg: filter.active ? '#fff' : 'var(--color-primary, #800020)', border: '1px solid rgba(0,0,0,0.06)' },
        training: { bg: filter.active ? '#1976d2' : '#e3f2fd', fg: filter.active ? '#fff' : '#1976d2', border: '1px solid #bbdefb' },
        homework: { bg: filter.active ? '#f57c00' : '#fff3e0', fg: filter.active ? '#fff' : '#b45309', border: '1px solid #ffe0b2' },
        quiz: { bg: filter.active ? '#6366f1' : '#eef2ff', fg: filter.active ? '#fff' : '#4f46e5', border: '1px solid #e0e7ff' }
      };
      return typeStyles[filter.id] || typeStyles.all;
    }
    
    if (variant === 'level') {
      const levelStyles = {
        all: { bg: filter.active ? 'var(--color-primary, #800020)' : '#fff', fg: filter.active ? '#fff' : 'var(--color-primary, #800020)', border: '1px solid rgba(0,0,0,0.06)' },
        beginner: { bg: filter.active ? '#2e7d32' : '#e8f5e9', fg: filter.active ? '#fff' : '#2e7d32', border: '1px solid transparent' },
        intermediate: { bg: filter.active ? '#b45309' : '#fff7ed', fg: filter.active ? '#fff' : '#b45309', border: '1px solid transparent' },
        advanced: { bg: filter.active ? '#b91c1c' : '#fee2e2', fg: filter.active ? '#fff' : '#b91c1c', border: '1px solid transparent' }
      };
      return levelStyles[filter.id] || levelStyles.all;
    }

    if (variant === 'status') {
      const statusStyles = {
        bookmark: { bg: filter.active ? '#f5c518' : '#fff', fg: filter.active ? '#1f2937' : '#b45309', border: '1px solid #f5c518' },
        featured: { bg: filter.active ? '#4f46e5' : '#eef2ff', fg: filter.active ? '#fff' : '#4f46e5', border: '1px solid #c7d2fe' },
        retake: { bg: filter.active ? '#0ea5e9' : '#ecfeff', fg: filter.active ? '#fff' : '#0ea5e9', border: '1px solid #bae6fd' },
        graded: { bg: filter.active ? '#16a34a' : '#ecfdf5', fg: filter.active ? '#fff' : '#16a34a', border: '1px solid #bbf7d0' },
        pending: { bg: filter.active ? '#f59e0b' : '#fffbeb', fg: filter.active ? '#fff' : '#b45309', border: '1px solid #fde68a' }
      };
      return statusStyles[filter.id] || { bg: '#fff', fg: '#333', border: '1px solid #e5e7eb' };
    }

    // Custom variant - use provided styles
    return {
      bg: filter.active ? (filter.activeBg || filter.fg) : (filter.bg || '#fff'),
      fg: filter.active ? '#fff' : (filter.fg || '#333'),
      border: filter.border || '1px solid rgba(0,0,0,0.06)'
    };
  };

  const getIcon = (filter) => {
    if (filter.icon) return filter.icon;
    
    if (variant === 'type') {
      if (filter.id === 'training') return <BookOpen size={14} />;
      if (filter.id === 'homework') return <ClipboardList size={14} />;
      if (filter.id === 'quiz') return <HelpCircle size={14} />;
    }
    
    if (variant === 'level') {
      return <Award size={14} />;
    }

    if (variant === 'status') {
      if (filter.id === 'bookmark') return filter.active ? <Star size={16} /> : <StarOff size={16} />;
      if (filter.id === 'featured') return <Pin size={16} />;
      if (filter.id === 'retake') return <Repeat size={16} />;
      if (filter.id === 'graded') return <CheckCircle size={16} />;
      if (filter.id === 'pending') return <Hourglass size={16} />;
    }

    return null;
  };

  return (
    <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', marginRight: 12 }}>
      {filters.map(filter => {
        const styles = getDefaultStyles(filter);
        const Icon = getIcon(filter);
        const isCircular = variant === 'status';

        return (
          <button
            key={filter.id}
            onClick={filter.onClick}
            title={filter.title || filter.label}
            style={{
              ...(isCircular ? {
                width: 32,
                height: 32,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: styles.border,
                background: styles.bg,
                color: styles.fg,
                cursor: 'pointer',
                transition: 'all 0.2s'
              } : {
                padding: '6px 12px',
                borderRadius: 999,
                border: styles.border,
                background: styles.bg,
                color: styles.fg,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: filter.id === 'all' ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              })
            }}
            onMouseEnter={(e) => {
              if (!filter.active) {
                e.currentTarget.style.opacity = '0.8';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {Icon}
            {!isCircular && <span>{filter.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

