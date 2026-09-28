import React from 'react';
import DatePicker from '@components/ui/DatePicker/DatePicker';
import { ChevronLeft, ChevronRight, FilePenLine, GitBranch } from 'lucide-react';
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
      color: isDark ? WELCOME_COLORS.tabBlue : WELCOME_COLORS.lightSelected,
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

function NavButton({ onClick, ariaLabel, dataTestid, children, padding, isDark, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
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

function normDate(d, endOfDay = false) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  dt.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return dt;
}

export default function WelcomeDateControls({
  tabParam,
  selectedDate,
  setSelectedDate,
  opsViewMode,
  setOpsViewMode,
  violationsViewMode,
  setViolationsViewMode,
  dayFocus = false,
  setDayFocus,
  hideWeekends = true,
  isInstructorOnly,
  isDark,
  isRTL,
  t,
  termRange = null,
  weekNavPrefix = null,
  opsNavSuffix = null,
  scheduledDayIndexes = null,
}) {
  const rangeStart = normDate(termRange?.startDate);
  const rangeEnd = normDate(termRange?.endDate, true);
  const clampDelta = (delta) => {
    const target = new Date(selectedDate);
    target.setDate(target.getDate() + delta);
    if (rangeStart && target < rangeStart) return rangeStart;
    if (rangeEnd && target > rangeEnd) return rangeEnd;
    return target;
  };
  const prevDisabled = rangeStart ? (() => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    // Allow going back while the previous week still overlaps the range
    const prevWeekEnd = new Date(prev);
    prevWeekEnd.setDate(prevWeekEnd.getDate() + (hideWeekends ? 4 : 6));
    return prevWeekEnd < rangeStart;
  })() : false;
  const nextOutOfRange = rangeEnd ? (() => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    const nextWeekStart = new Date(next);
    nextWeekStart.setDate(nextWeekStart.getDate() - nextWeekStart.getDay());
    return nextWeekStart > rangeEnd;
  })() : false;
  if (tabParam === 'schedule') {
    const handleToggleDayFocus = () => {
      if (!dayFocus) {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        setSelectedDate(today);
      }
      setDayFocus(!dayFocus);
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(selectedDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(0, 0, 0, 0);
    const nextDisabled = nextOutOfRange || (isInstructorOnly && nextWeek.getTime() > today.getTime());
    const handlePrevClamped = () => { if (!prevDisabled) setSelectedDate(clampDelta(-7)); };
    const handleNextClamped = () => { if (!nextDisabled) setSelectedDate(clampDelta(7)); };
    return (
      <div data-tour="welcome-week-nav" style={{ display: 'flex', alignItems: 'center', gap: WELCOME_SIZES.gapSm, flexShrink: 0 }}>
        {weekNavPrefix}
        <NavButton onClick={handlePrevClamped} disabled={prevDisabled} ariaLabel={t('calendar_previous') || 'Previous week'} dataTestid="welcome-week-prev" padding={WELCOME_SIZES.paddingSm} isDark={isDark}>
          {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </NavButton>
        <WeekRangeDisplay selectedDate={selectedDate} isDark={isDark} hideWeekends={hideWeekends} />
        <NavButton onClick={handleNextClamped} disabled={nextDisabled} ariaLabel={t('calendar_next') || 'Next week'} dataTestid="welcome-week-next" padding={WELCOME_SIZES.paddingSm} isDark={isDark}>
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
    const opsPrevDisabled = rangeStart ? (() => {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - delta);
      const edge = new Date(prev);
      edge.setDate(edge.getDate() + (opsViewMode === OPS_VIEW_MODES.WEEK ? (hideWeekends ? 4 : 6) : 0));
      return edge < rangeStart;
    })() : false;
    const opsNextDisabled = rangeEnd ? (() => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + delta);
      return next > rangeEnd;
    })() : false;
    // In day mode, skip weekdays with no scheduled classes (weekends, days off).
    const canSkipEmptyDays = opsViewMode === OPS_VIEW_MODES.DAY && Boolean(scheduledDayIndexes?.size);
    const findScheduledDay = (dir) => {
      const d = new Date(selectedDate);
      for (let i = 0; i < 31; i += 1) {
        d.setDate(d.getDate() + dir);
        if (rangeStart && d < rangeStart) return null;
        if (rangeEnd && d > rangeEnd) return null;
        if (scheduledDayIndexes.has(d.getDay())) return new Date(d);
      }
      return null;
    };
    const prevBlocked = opsPrevDisabled || (canSkipEmptyDays && !findScheduledDay(-1));
    const nextBlocked = opsNextDisabled || (canSkipEmptyDays && !findScheduledDay(1));
    const handlePrev = () => {
      if (prevBlocked) return;
      setSelectedDate(canSkipEmptyDays ? findScheduledDay(-1) : clampDelta(-delta));
    };
    const handleNext = () => {
      if (nextBlocked) return;
      setSelectedDate(canSkipEmptyDays ? findScheduledDay(1) : clampDelta(delta));
    };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: WELCOME_SIZES.gapSm, flexShrink: 0, justifyContent: 'center' }}>
        {opsNavSuffix}
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#2563eb',
            backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff',
            padding: '3px 10px',
            borderRadius: WELCOME_SIZES.borderRadiusSm,
            border: `1px solid ${isDark ? '#1e40af' : '#bfdbfe'}`,
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          data-testid="ops-view-mode-label"
        >
          {opsViewMode === OPS_VIEW_MODES.WEEK ? <GitBranch size={12} color="#2563eb" /> : <FilePenLine size={12} color="#2563eb" />}
          {opsViewMode === OPS_VIEW_MODES.WEEK ? t('weekly_attendance', 'Weekly Attendance') : t('daily_attendance', 'Daily Attendance')}
        </span>
        {!isInstructorOnly && (
          <NavButton onClick={handlePrev} disabled={prevBlocked} ariaLabel={t('calendar_previous') || 'Previous'} dataTestid="welcome-day-prev" padding={WELCOME_SIZES.paddingXs} isDark={isDark}>
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
            min={termRange?.startDate ? new Date(termRange.startDate).toISOString().slice(0, 10) : undefined}
            max={termRange?.endDate ? new Date(termRange.endDate).toISOString().slice(0, 10) : undefined}
            className="welcome-working-date-picker"
            data-testid="welcome-working-date"
            style={{ width: WELCOME_SIZES.datePickerWidth }}
          />
        )}
        {!isInstructorOnly && (
          <NavButton onClick={handleNext} disabled={nextBlocked} ariaLabel={t('calendar_next') || 'Next'} dataTestid="welcome-day-next" padding={WELCOME_SIZES.paddingXs} isDark={isDark}>
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

  if (tabParam === 'violations') {
    const mode = violationsViewMode || OPS_VIEW_MODES.DAY;
    const delta = mode === OPS_VIEW_MODES.WEEK ? 7 : 1;
    const vPrevDisabled = rangeStart ? (() => {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - delta);
      const edge = new Date(prev);
      edge.setDate(edge.getDate() + (mode === OPS_VIEW_MODES.WEEK ? (hideWeekends ? 4 : 6) : 0));
      return edge < rangeStart;
    })() : false;
    const vNextDisabled = rangeEnd ? (() => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + delta);
      return next > rangeEnd;
    })() : false;
    const handlePrev = () => {
      if (vPrevDisabled) return;
      setSelectedDate(clampDelta(-delta));
    };
    const handleNext = () => {
      if (vNextDisabled) return;
      setSelectedDate(clampDelta(delta));
    };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: WELCOME_SIZES.gapSm, flexShrink: 0, justifyContent: 'center' }}>
        <NavButton onClick={handlePrev} disabled={vPrevDisabled} ariaLabel={t('calendar_previous') || 'Previous'} dataTestid="violations-day-prev" padding={WELCOME_SIZES.paddingXs} isDark={isDark}>
          {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </NavButton>
        {mode === OPS_VIEW_MODES.WEEK ? (
          <WeekRangeDisplay selectedDate={selectedDate} isDark={isDark} />
        ) : (
          <DatePicker
            value={selectedDate.toISOString().slice(0, 10)}
            onChange={(value) => {
              const iso = typeof value === 'string' ? value : value?.toISOString?.()?.slice(0, 10);
              if (iso) setSelectedDate(new Date(`${iso}T12:00:00`));
            }}
            theme={isDark ? 'dark' : 'light'}
            showIcon
            compact
            min={termRange?.startDate ? new Date(termRange.startDate).toISOString().slice(0, 10) : undefined}
            max={termRange?.endDate ? new Date(termRange.endDate).toISOString().slice(0, 10) : undefined}
            className="welcome-working-date-picker"
            data-testid="violations-date"
            style={{ width: WELCOME_SIZES.datePickerWidth }}
          />
        )}
        <NavButton onClick={handleNext} disabled={vNextDisabled} ariaLabel={t('calendar_next') || 'Next'} dataTestid="violations-day-next" padding={WELCOME_SIZES.paddingXs} isDark={isDark}>
          {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </NavButton>
        <div style={{ display: 'flex', borderRadius: WELCOME_SIZES.borderRadiusSm, overflow: 'hidden', border: `1px solid ${isDark ? WELCOME_COLORS.darkBorder : WELCOME_COLORS.lightBorder}` }}>
          <ToggleButton
            active={mode === OPS_VIEW_MODES.DAY}
            onClick={() => { setViolationsViewMode(OPS_VIEW_MODES.DAY); try { localStorage.setItem(WELCOME_STORAGE_KEYS.VIOLATIONS_VIEW_MODE, OPS_VIEW_MODES.DAY); } catch {} }}
            isDark={isDark}
          >
            {t('day') || 'Day'}
          </ToggleButton>
          <ToggleButton
            active={mode === OPS_VIEW_MODES.WEEK}
            onClick={() => { setViolationsViewMode(OPS_VIEW_MODES.WEEK); try { localStorage.setItem(WELCOME_STORAGE_KEYS.VIOLATIONS_VIEW_MODE, OPS_VIEW_MODES.WEEK); } catch {} }}
            isDark={isDark}
          >
            {t('week') || 'Week'}
          </ToggleButton>
        </div>
      </div>
    );
  }

  return null;
}
