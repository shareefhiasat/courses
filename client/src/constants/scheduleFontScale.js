/** Base px for welcome schedule grid at 100% scale */
export const SCHEDULE_FONT_BASE_PX = 11;

export const SCHEDULE_FONT_SCALE_MIN = 50;
export const SCHEDULE_FONT_SCALE_MAX = 200;
export const SCHEDULE_FONT_SCALE_DEFAULT = 100;
export const SCHEDULE_FONT_SCALE_STEP = 2;

export function scheduleFontPxFromScale(scalePercent) {
  const clamped = clampScheduleFontScale(scalePercent);
  return SCHEDULE_FONT_BASE_PX * (clamped / 100);
}

export function clampScheduleFontScale(scalePercent) {
  const raw = Number(scalePercent) || SCHEDULE_FONT_SCALE_DEFAULT;
  const stepped = Math.round(raw / SCHEDULE_FONT_SCALE_STEP) * SCHEDULE_FONT_SCALE_STEP;
  return Math.min(
    SCHEDULE_FONT_SCALE_MAX,
    Math.max(SCHEDULE_FONT_SCALE_MIN, stepped),
  );
}
