/** Shared constants for the Welcome page floating controls and date navigation. */

export const OPS_VIEW_MODES = Object.freeze({
  DAY: 'day',
  WEEK: 'week',
});

export const WELCOME_STORAGE_KEYS = Object.freeze({
  OPS_VIEW_MODE: 'welcome_ops_view_mode',
  FLOATING_TABS_POS: 'welcome_floating_tabs_pos',
  FLOATING_DATE_POS: 'welcome_floating_date_pos',
  SCHEDULE_SHOW_ROOM: 'welcome_schedule_show_room',
  SCHEDULE_SHOW_INSTRUCTOR: 'welcome_schedule_show_instructor',
  SCHEDULE_SHOW_DAY_DATE: 'welcome_schedule_show_day_date',
  SCHEDULE_SHOW_BREAK_COLUMNS: 'welcome_schedule_show_break_columns',
  SCHEDULE_DAY_FOCUS: 'welcome_schedule_day_focus',
  SCHEDULE_HIDE_WEEKENDS: 'welcome_schedule_hide_weekends',
});

export const WELCOME_COLORS = Object.freeze({
  darkMuted: '#94a3b8',
  lightMuted: '#64748b',
  darkText: '#e2e8f0',
  lightText: '#1e293b',
  darkSelected: '#1e40af',
  lightSelected: '#2563eb',
  white: '#fff',
  darkBorder: '#334155',
  lightBorder: '#cbd5e1',
  tabBlue: '#3b82f6',
  gold: '#D4AF37',
});

export const WELCOME_SIZES = Object.freeze({
  borderRadiusSm: '6px',
  borderRadiusLg: '20px',
  gapSm: '4px',
  paddingSm: '4px',
  paddingXs: '2px',
  paddingToggle: '2px 8px',
  paddingWeekSpan: '0 6px',
  fontSizeWeek: '0.72rem',
  fontSizeToggle: '0.7rem',
  fontSizeTab: '0.75rem',
  fontSizeFontLabel: 11,
  fontWeightSemibold: 600,
  weekSpanWidth: 38,
  datePickerWidth: 130,
  sliderWidth: 60,
  fontLabelMinWidth: 34,
  tabMinHeight: 28,
  floatingZIndex: 1450,
  floatingTop: 48,
  floatingDateTop: 96,
  floatingLeft: 8,
  clampMargin: 8,
});
