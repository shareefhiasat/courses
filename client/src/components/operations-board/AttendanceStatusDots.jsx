import React, { useMemo } from 'react';
import { ATTENDANCE_COUNT_ITEMS } from './boardClassCalendarUtils.js';

export default function AttendanceStatusDots({
  summary,
  items,
  dotSize = 12,
  className = '',
  ariaLabel,
  style = {},
  overlap,
}) {
  const dotItems = useMemo(() => {
    if (items) return items.filter((i) => i.count > 0);
    if (!summary) return [];
    return ATTENDANCE_COUNT_ITEMS.map((item) => ({
      ...item,
      count: summary[item.key] || 0,
    })).filter((i) => i.count > 0);
  }, [items, summary]);

  if (!dotItems.length) return null;

  const overlapValue = overlap == null ? dotSize / 2 : overlap;

  return (
    <span
      className={className}
      aria-label={ariaLabel}
      style={{ display: 'inline-flex', alignItems: 'center', ...style }}
    >
      {dotItems.map((dot, idx) => (
        <span
          key={dot.key || `${dot.color}-${idx}`}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: dot.color,
            border: '2px solid #fff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
            zIndex: dotItems.length - idx,
            marginInlineStart: idx > 0 ? -overlapValue : 0,
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  );
}
