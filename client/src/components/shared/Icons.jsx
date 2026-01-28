import React from 'react';

/**
 * Reusable Icon Components
 * Extracted for DRY principle and Storybook compatibility
 */

export const XIcon = ({ style, size = 24, color = 'currentColor' }) => (
  <svg 
    style={style} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const HistoryIcon = ({ style, size = 24, color = 'currentColor' }) => (
  <svg 
    style={style} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
  </svg>
);

export const TypeIcon = ({ 
  iconName, 
  style = {}, 
  size = 16, 
  color = null,
  fromConstants = null 
}) => {
  // If fromConstants is provided, use it for color determination
  let finalColor = color || '#374151';
  
  if (fromConstants && typeof fromConstants.getColor === 'function') {
    finalColor = fromConstants.getColor(iconName) || finalColor;
  }
  
  const iconProps = {
    width: style.width || size,
    height: style.height || size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: finalColor,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  const icons = {
    MessageSquare: (
      <svg {...iconProps}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    Bed: (
      <svg {...iconProps}>
        <path d="M2 4v16" />
        <path d="M2 8h18a2 2 0 0 1 2 2v10" />
        <path d="M2 17h20" />
        <path d="M6 8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      </svg>
    ),
    Users: (
      <svg {...iconProps}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    Smartphone: (
      <svg {...iconProps}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    AlertTriangle: (
      <svg {...iconProps}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    Clock: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    CheckCircle: (
      <svg {...iconProps}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    Award: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
    FileText: (
      <svg {...iconProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
    Star: (
      <svg {...iconProps}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    XCircle: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    HelpCircle: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    Plus: (
      <svg {...iconProps}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    Minus: (
      <svg {...iconProps}>
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    X: (
      <svg {...iconProps}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    MoreHorizontal: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    )
  };

  return icons[iconName] || icons.MessageSquare;
};

// Storybook stories export
export default {
  title: 'Shared/Icons',
  component: TypeIcon,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    iconName: {
      control: 'select',
      options: Object.keys({
        MessageSquare: null,
        Bed: null,
        Users: null,
        Smartphone: null,
        AlertTriangle: null,
        Clock: null,
        CheckCircle: null,
        Award: null,
        FileText: null,
        Star: null,
        XCircle: null,
        HelpCircle: null,
        Plus: null,
        Minus: null,
        X: null,
        MoreHorizontal: null
      }),
    },
    size: {
      control: { type: 'range', min: 12, max: 48, step: 4 },
      defaultValue: 16,
    },
    color: {
      control: 'color',
      defaultValue: '#374151',
    }
  }
};
