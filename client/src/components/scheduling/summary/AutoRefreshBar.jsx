import React, { useEffect, useState, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Select } from '@ui';
import { RefreshCw } from 'lucide-react';

const INTERVALS = [
  { value: 0, labelKey: 'auto_refresh_off' },
  { value: 15000, labelKey: 'refresh_15s' },
  { value: 30000, labelKey: 'refresh_30s' },
  { value: 60000, labelKey: 'refresh_1m' },
  { value: 300000, labelKey: 'refresh_5m' },
];

export default function AutoRefreshBar({
  onRefresh,
  intervalMs = 30000,
  onIntervalChange,
  compact = false,
  showInterval = true,
  showLastUpdated = true,
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const [ms, setMs] = useState(intervalMs);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [tick, setTick] = useState(Date.now());

  const handleRefresh = useCallback(async () => {
    await onRefresh?.();
    setLastUpdated(Date.now());
  }, [onRefresh]);

  useEffect(() => {
    if (!ms) return undefined;
    const id = setInterval(() => {
      setTick(Date.now());
      handleRefresh();
    }, ms);
    return () => clearInterval(id);
  }, [ms, handleRefresh]);

  useEffect(() => {
    if (!ms) return undefined;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ms]);

  const progress = ms ? ((tick - lastUpdated) % ms) / ms * 100 : 0;
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';

  const handleIntervalChange = (e) => {
    const val = Number(e.target.value);
    setMs(val);
    onIntervalChange?.(val);
  };

  const refreshLabel = INTERVALS.find((i) => i.value === ms);
  const intervalLabel = refreshLabel ? (t(refreshLabel.labelKey) || refreshLabel.labelKey) : '';
  const compactButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.65rem',
    fontSize: 'var(--font-size-sm)',
    borderRadius: '6px',
    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
    background: theme === 'dark' ? '#374151' : '#fff',
    color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  if (compact) {
    return (
      <div
        data-testid="auto-refresh-bar"
        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}
      >
        {showInterval && (
          <Select
            placeholder={t('select_refresh_interval') || 'Refresh interval'}
            value={ms}
            onChange={handleIntervalChange}
            options={INTERVALS.map((i) => ({
              value: i.value,
              label: t(i.labelKey) || i.labelKey,
            }))}
            style={{ minWidth: '110px', maxWidth: '140px' }}
            size="small"
            data-testid="refresh-interval-select"
          />
        )}
        <button
          type="button"
          onClick={handleRefresh}
          data-testid="manual-refresh-btn"
          title={t('refresh') || 'Refresh'}
          aria-label={t('refresh') || 'Refresh'}
          style={compactButtonStyle}
        >
          <RefreshCw size={14} />
          <span>{t('refresh') || 'Refresh'}</span>
        </button>
        {ms > 0 && (
          <div style={{ width: '48px', height: '4px', background: theme === 'dark' ? '#374151' : '#e5e7eb', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: '#10b981', borderRadius: '2px', transition: 'width 0.25s linear' }} />
          </div>
        )}
        {showLastUpdated && (
          <span style={{ fontSize: '0.6875rem', color: muted, whiteSpace: 'nowrap' }}>
            {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="auto-refresh-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        marginBottom: '1rem',
      }}
    >
      <button
        type="button"
        onClick={handleRefresh}
        data-testid="manual-refresh-btn"
        title={t('refresh') || 'Refresh'}
        aria-label={t('refresh') || 'Refresh'}
        style={compactButtonStyle}
      >
        <RefreshCw size={16} />
        <span>{t('refresh') || 'Refresh'}</span>
      </button>
      <Select
        placeholder={t('select_refresh_interval') || 'Select refresh interval'}
        value={ms}
        onChange={handleIntervalChange}
        options={INTERVALS.map((i) => ({
          value: i.value,
          label: t(i.labelKey) || i.labelKey,
        }))}
        style={{ minWidth: '140px' }}
        data-testid="refresh-interval-select"
      />
      {ms > 0 && (
        <div style={{ flex: 1, minWidth: '120px', height: '4px', background: theme === 'dark' ? '#374151' : '#e5e7eb', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: '#10b981', borderRadius: '2px', transition: 'width 0.25s linear' }} />
        </div>
      )}
      <span style={{ fontSize: 'var(--font-size-xs)', color: muted }}>
        {t('last_updated') || 'Last updated'}: {new Date(lastUpdated).toLocaleTimeString()}
      </span>
    </div>
  );
}
