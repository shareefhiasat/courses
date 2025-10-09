import React, { useMemo } from 'react';
import { useLang } from '../contexts/LangContext';

// Helper: convert various inputs to a datetime-local string (YYYY-MM-DDTHH:MM)
function toLocalInputValue(val) {
  if (!val) return '';
  let d;
  if (typeof val === 'object' && val.seconds) {
    d = new Date(val.seconds * 1000);
  } else if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'string') {
    // If DD/MM/YYYY or DD/MM/YYYY HH:mm
    const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
    if (m) {
      const [, dd, mm, yyyy, HH = '00', MM = '00'] = m;
      d = new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}:00`);
    } else {
      const tmp = new Date(val);
      d = isNaN(tmp.getTime()) ? null : tmp;
    }
  }
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

// Helper: from input value to ISO string
function fromLocalInputValue(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

// Helper: pretty DD/MM/YYYY HH:mm for hint
function toPretty(val) {
  if (!val) return '';
  let d;
  if (typeof val === 'object' && val.seconds) {
    d = new Date(val.seconds * 1000);
  } else if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'string') {
    const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
    if (m) {
      return val.length > 10 ? val : `${val} 00:00`;
    }
    const tmp = new Date(val);
    d = isNaN(tmp.getTime()) ? null : tmp;
  }
  return d 
    ? d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
}

export default function DateTimePicker({ value, onChange, placeholder = 'DD/MM/YYYY HH:MM', allowClear = true, id }) {
  const { isRTL } = useLang();
  const inputValue = useMemo(() => toLocalInputValue(value), [value]);
  const pretty = useMemo(() => {
    if (!value) return '';
    // If we already produced an ISO string previously, show as pretty
    if (typeof value === 'string' && value.includes('T')) {
      const d = new Date(value);
      return isNaN(d.getTime()) 
        ? '' 
        : d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return toPretty(value);
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          id={id}
          type="datetime-local"
          lang="en-GB"
          value={inputValue}
          onChange={(e) => onChange(fromLocalInputValue(e.target.value))}
          placeholder={placeholder}
          style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
        />
        {allowClear && (
          <button type="button" onClick={() => onChange('')} style={{ 
            padding: '8px 10px', 
            borderRadius: 6, 
            border: '1px solid #ddd', 
            background: '#fff', 
            cursor: 'pointer',
            color: '#666',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            ✖
          </button>
        )}
      </div>
      <small style={{ color: '#666' }}>
        {pretty ? `Selected: ${pretty}` : 'Format: DD/MM/YYYY HH:MM'}
      </small>
    </div>
  );
}
