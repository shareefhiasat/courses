import React from 'react';
import { DRIVE_TIMELINE } from './constants';

/**
 * Unified list card for timeline panels (comments, activity, versions, shares).
 */
export default function DriveListCard({
  avatar,
  title,
  subtitle,
  meta,
  timestamp,
  actions,
  borderColor,
  highlight = false,
  children,
  as: Component = 'article',
}) {
  return (
    <Component
      style={{
        padding: DRIVE_TIMELINE.CARD_PADDING,
        minHeight: DRIVE_TIMELINE.CARD_MIN_HEIGHT,
        background: 'var(--panel, white)',
        borderRadius: DRIVE_TIMELINE.CARD_BORDER_RADIUS,
        border: `${highlight ? '2px' : '1px'} solid ${borderColor || 'var(--border, #e5e7eb)'}`,
        boxShadow: highlight ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          {avatar}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: subtitle || meta ? '0.25rem' : 0 }}>
                {typeof title === 'string' ? (
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text, #111827)' }}>
                    {title}
                  </span>
                ) : title}
              </div>
            )}
            {subtitle && (
              typeof subtitle === 'string' ? (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text, #374151)', margin: 0, wordBreak: 'break-word' }}>
                  {subtitle}
                </p>
              ) : subtitle
            )}
            {meta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)', marginTop: subtitle ? '0.25rem' : 0 }}>
                {meta}
              </div>
            )}
            {children}
          </div>
        </div>
        {(timestamp || actions) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
            {timestamp && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {timestamp}
              </span>
            )}
            {actions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </Component>
  );
}
