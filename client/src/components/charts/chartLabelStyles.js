export const CHART_LABEL_SHADOW = {
  paintOrder: 'stroke',
  stroke: 'rgba(0, 0, 0, 0.9)',
  strokeWidth: 3,
  strokeLinejoin: 'round',
};

export const CHART_LABEL_FILL = '#ffffff';

/** White text with black-to-gold gradient shadow for HTML legend text. */
export const HTML_LEGEND_TEXT_STYLE = {
  color: '#ffffff',
  lineHeight: 1.3,
  textShadow: [
    '0 0 1px #000',
    '0 0 2px #000',
    '0 0 3px #1a1500',
    '0 0 4px #3d3500',
    '0 0 5px #5c4d00',
    '0 0 6px #7a6600',
    '0 0 7px #998200',
    '0 0 8px #b89d00',
    '0 0 9px #d4b300',
    '0 0 10px #ffd700',
  ].join(', '),
};

export const PIE_LEGEND_TEXT_STYLE = {
  ...HTML_LEGEND_TEXT_STYLE,
  fontSize: 'inherit',
};

export const PIE_LEGEND_ITEM_BG = 'rgba(0, 0, 0, 0.25)';
