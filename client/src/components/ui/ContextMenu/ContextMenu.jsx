import React, { useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { Paper, MenuList, MenuItem, ListItemIcon, ListItemText, ClickAwayListener } from '@mui/material';

/**
 * Reusable ContextMenu component for right-click actions
 * Supports localization, responsiveness, and dynamic actions
 */
const ContextMenu = ({
  isOpen,
  onClose,
  position = { x: 0, y: 0 },
  actions = [],
  t = (key) => key,
  theme: customTheme,
  'data-testid': dataTestId = 'context-menu'
}) => {
  const muiTheme = useTheme();
  const menuRef = useRef(null);
  const effectiveTheme = customTheme || muiTheme;

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Adjust position if menu would go off-screen
  const getAdjustedPosition = () => {
    if (!menuRef.current || !isOpen) return position;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    // Adjust horizontal position
    if (position.x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10;
    }

    // Adjust vertical position
    if (position.y + menuRect.height > viewportHeight) {
      adjustedY = viewportHeight - menuRect.height - 10;
    }

    // Ensure menu doesn't go off left or top edge
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    return { x: adjustedX, y: adjustedY };
  };

  const adjustedPosition = getAdjustedPosition();

  if (!isOpen) return null;

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Paper
        ref={menuRef}
        data-testid={dataTestId}
        sx={{
          position: 'fixed',
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          zIndex: 9999,
          minWidth: 200,
          maxWidth: 300,
          boxShadow: effectiveTheme.shadows[4],
          borderRadius: 1,
          backgroundColor: effectiveTheme.palette.background.paper,
          // Responsive adjustments
          '@media (max-width: 768px)': {
            minWidth: 180,
            maxWidth: 'calc(100vw - 40px)',
          },
        }}
      >
        <MenuList dense>
          {actions.map((action, index) => (
            <MenuItem
              key={index}
              data-testid={`${dataTestId}-item-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                onClose();
              }}
              disabled={action.disabled}
              sx={{
                '&:hover': {
                  backgroundColor: effectiveTheme.palette.action.hover,
                },
                // Responsive touch targets
                minHeight: 48,
                '@media (max-width: 768px)': {
                  minHeight: 52,
                },
              }}
            >
              {action.icon && (
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: action.danger ? effectiveTheme.palette.error.main : 'inherit',
                  }}
                >
                  {action.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={t(action.label) || action.label}
                sx={{
                  color: action.danger ? effectiveTheme.palette.error.main : 'inherit',
                }}
              />
            </MenuItem>
          ))}
        </MenuList>
      </Paper>
    </ClickAwayListener>
  );
};

export default ContextMenu;
