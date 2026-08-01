import React from 'react';
import DatePicker from '@components/ui/DatePicker/DatePicker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  OPS_VIEW_MODES,
  WELCOME_STORAGE_KEYS,
  WELCOME_COLORS,
  WELCOME_SIZES,
} from './welcomeControls.constants';

function getWeekRange(date, hideWeekends = true) {
  const ws = new Date(date);
  ws.setDate(ws.getDate() - ws.getDay());
  const we = new Date(ws);
  we.setDate(we.getDate() + (hideWeekends ? 4 : 6));
  const fmt = (x) => `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`;
  const jan1 = new Date(ws.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((ws - jan1) / 86400000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return { ws, we, fmt, weekNum };
}

function WeekRangeDisplay({ selectedDate, isDark, hideWeekends }) {
  const { ws, we, fmt, weekNum } = getWeekRange(selectedDate, hideWeekends);
  return (
    <span style={{
      fontSize: WELCOME_SIZES.fontSizeWeek,
      fontWeight: WELCOME_SIZES.fontWeightSemibold,
      color: isDark ? WELCOME_COLORS.darkText : WELCOME_COLORS.lightText,
      whiteSpace: 'nowrap',
      padding: WELCOME_SIZES.paddingWeekSpan,
      display: 'inline-flex',
      alignItems: 'center',
      gap: WELCOME_SIZES.gapSm,
    }}>
      <span style={{ display: 'inline-block', width: WELCOME_SIZES.weekSpanWidth, textAlign: 'right' }}>W{weekNum}</span>
      <span style={{ display: 'inline-block', width: WELCOME_SIZES.weekSpanWidth, textAlign: 'center' }}>{fmt(ws)}</span>
      <span style={{ opacity: 0.5 }}>-</span>
      <span style={{ display: 'inline-block', width: WELCOME_SIZES.weekSpanWidth, textAlign: 'center' }}>{fmt(we)}</span>
    </span>
  );
}

function NavButton({ onClick, ariaLabel, dataTestid, children, padding, isDark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding,
        borderRadius: WELCOME_SIZES.borderRadiusSm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDark ? WELCOME_COLORS.darkMuted : WELCOME_COLORS.lightMuted,
      }}
      data-testid={dataTestid}
    >
      {children}
    </button>
  );
}

function ToggleButton({ active, onClick, children, isDark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? (isDark ? WELCOME_COLORS.darkSelected : WELCOME_COLORS.lightSelected) : 'transparent',
        color: active ? WELCOME_COLORS.white : (isDark ? WELCOME_COLORS.darkMuted : WELCOME_COLORS.lightMuted),
        border: 'none',
        cursor: 'pointer',
        padding: WELCOME_SIZES.paddingToggle,
        fontSize: WELCOME_SIZES.fontSizeToggle,
        fontWeight: WELCOME_SIZES.fontWeightSemibold,
      }}
    >
      {children}
    </button>
  );
}

export default function WelcomeDateControls({
  tabParam,
  selectedDate,
  setSelectedDate,
  opsViewMode,
  setOpsViewMode,
  dayFocus = false,
  setDayFocus,
  hideWeekends = true,
  isInstructorOnly,
  isDark,
  isRTL,
  t,
}) {
  if (tabParam === 'schedule' && !isInstructorOnly) {
    const handlePrev = () => {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - 7);
      setSelectedDate(prev);
    };
    const handleNext = () => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 7);
      setSelectedDate(next);
    };
    const handleToggleDayFocus = () => {
      if (!dayFocus) {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        setSelectedDate(today);
      }
      setDayFocus(!dayFocus);
    };
    return (
      <div data-tour="welcome-week-nav" style={{ display: 'flex', alignItems: 'center', gap: WELCOME_SIZES.gapSm, flexShrink: 0 }}>
        <NavButton onClick={handlePrev} ariaLabel={t('calendar_previous') || 'Previous week'} dataTestid="welcome-week-prev" padding={WELCOME_SIZES.paddingSm} isDark={isDark}>
          {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </NavButton>
        <WeekRangeDisplay selectedDate={selectedDate} isDark={isDark} hideWeekends={hideWeekends} />
        <NavButton onClick={handleNext} ariaLabel={t('calendar_next') || 'Next week'} dataTestid="welcome-week-next" padding={WELCOME_SIZES.paddingSm} isDark={isDark}>
          {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </NavButton>
        <div style={{ display: 'flex', borderRadius: WELCOME_SIZES.borderRadiusSm, overflow: 'hidden', border: `1px solid ${isDark ? WELCOME_COLORS.darkBorder : WELCOME_COLORS.lightBorder}`, marginInlineStart: WELCOME_SIZES.gapSm }}>
          <ToggleButton active={!dayFocus} onClick={() => setDayFocus(false)} isDark={isDark}>
            {t('week') || 'Week'}
          </ToggleButton>
          <ToggleButton active={dayFocus} onClick={handleToggleDayFocus} isDark={isDark}>
            {t('today') || 'Today'}
          </ToggleButton>
        </div>
      </div>
    );
  }

  if (tabParam === 'operations') {
    const delta = opsViewMode === OPS_VIEW_MODES.WEEK ? 7 : 1;
    const handlePrev = () => {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - delta);
      setSelectedDate(prev);
    };
    const handleNext = () => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + delta);
      setSelectedDate(next);
    };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: WELCOME_SIZES.gapSm, flexShrink: 0, justifyContent: 'center' }}>
        {!isInstructorOnly && (
          <NavButton onClick={handlePrev} ariaLabel={t('calendar_previous') || 'Previous'} dataTestid="welcome-day-prev" padding={WELCOME_SIZES.paddingXs} isDark={isDark}>
            {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </NavButton>
        )}
        {opsViewMode === OPS_VIEW_MODES.WEEK ? (
          <WeekRangeDisplay selectedDate={selectedDate} isDark={isDark} />
        ) : (
          <DatePicker
            value={selectedDate.toISOString().slice(0, 10)}
            onChange={(value) => {
              const iso = typeof value === 'string' ? value : value?.toISOString?.()?.slice(0, 10);
              if (iso) setSelectedDate(new Date(`${iso}T12:00:00`));
            }}
            theme={isDark ? 'dark' : 'light'}
            showIcon={!isInstructorOnly}
            compact
            disabled={isInstructorOnly}
            className="welcome-working-date-picker"
            data-testid="welcome-working-date"
            style={{ width: WELCOME_SIZES.datePickerWidth }}
          />
        )}
        {!isInstructorOnly && (
          <NavButton onClick={handleNext} ariaLabel={t('calendar_next') || 'Next'} dataTestid="welcome-day-next" padding={WELCOME_SIZES.paddingXs} isDark={isDark}>
            {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </NavButton>
        )}
        <div style={{ display: 'flex', borderRadius: WELCOME_SIZES.borderRadiusSm, overflow: 'hidden', border: `1px solid ${isDark ? WELCOME_COLORS.darkBorder : WELCOME_COLORS.lightBorder}` }}>
          <ToggleButton
            active={opsViewMode === OPS_VIEW_MODES.DAY}
            onClick={() => { setOpsViewMode(OPS_VIEW_MODES.DAY); try { localStorage.setItem(WELCOME_STORAGE_KEYS.OPS_VIEW_MODE, OPS_VIEW_MODES.DAY); } catch {} }}
            isDark={isDark}
          >
            {t('day') || 'Day'}
          </ToggleButton>
          {!isInstructorOnly && (
            <ToggleButton
              active={opsViewMode === OPS_VIEW_MODES.WEEK}
              onClick={() => { setOpsViewMode(OPS_VIEW_MODES.WEEK); try { localStorage.setItem(WELCOME_STORAGE_KEYS.OPS_VIEW_MODE, OPS_VIEW_MODES.WEEK); } catch {} }}
              isDark={isDark}
            >
              {t('week') || 'Week'}
            </ToggleButton>
          )}
        </div>
      </div>
    );
  }

  return null;
}
