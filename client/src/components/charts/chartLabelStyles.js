export const CHART_LABEL_SHADOW = {
  paintOrder: 'stroke',
  stroke: 'rgba(0, 0, 0, 0.9)',
  strokeWidth: 3,
  strokeLinejoin: 'round',
};

export const CHART_LABEL_FILL = '#ffffff';

/** White text with black shadow for HTML legend text. */
export const HTML_LEGEND_TEXT_STYLE = {
  color: '#ffffff',
  lineHeight: 1.3,
  textShadow: [
    '0 0 1px #000',
    '0 0 2px #000',
    '0 0 3px #000',
    '0 0 4px #000',
    '0 1px 6px rgba(0, 0, 0, 0.9)',
  ].join(', '),
};

export const PIE_LEGEND_TEXT_STYLE = {
  ...HTML_LEGEND_TEXT_STYLE,
  fontSize: 'inherit',
};

export const PIE_LEGEND_ITEM_BG = 'rgba(255, 215, 0, 0.25)';
