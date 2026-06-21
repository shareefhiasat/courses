export const CHART_LABEL_SHADOW = {
  paintOrder: 'stroke',
  stroke: 'rgba(255, 255, 255, 0.95)',
  strokeWidth: 3,
  strokeLinejoin: 'round',
};

export const CHART_LABEL_FILL = '#1f2937';

/** White halo for HTML legend text (stroke CSS does not work on <span>). */
export const HTML_LEGEND_TEXT_STYLE = {
  color: CHART_LABEL_FILL,
  lineHeight: 1.3,
  textShadow: '0 0 4px #fff, 0 0 4px #fff, 1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff',
};

export const PIE_LEGEND_TEXT_STYLE = {
  ...HTML_LEGEND_TEXT_STYLE,
  fontSize: 'inherit',
};

export const PIE_LEGEND_ITEM_BG = 'rgba(255, 255, 255, 0.1)';
