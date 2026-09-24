import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import { ChevronDown, ChevronUp, ChevronRight, ChevronLeft } from 'lucide-react';
import ColoredTooltip from './ColoredTooltip';

function TrailingActionButton({ action, onClose }) {
  const color = action.tooltipColor || action.color || '#64748b';
  const disabled = action.disabled;
  return (
    <ColoredTooltip title={action.title || ''} color={color} placement="top">
      <Box
        onClick={disabled ? undefined : (e) => {
          e.stopPropagation();
          action.onClick?.();
          if (!action.keepOpen) onClose?.();
        }}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: 0.75,
          opacity: disabled ? 0.4 : 0.75,
          '&:hover': disabled ? {} : { bgcolor: 'action.selected', opacity: 1 },
        }}
      >
        {action.icon}
      </Box>
    </ColoredTooltip>
  );
}

function resolveMenuLabel(item, t) {
  if (item.labelNode) return item.labelNode;
  if (item.labelKey) return t(item.labelKey) || item.labelFallback || item.labelKey;
  if (typeof item.label === 'string') return item.label;
  return item.label;
}

function AppMenuItem({
  action,
  t,
  onClose,
  closeAll,
  expanded,
  onToggle,
  cascade,
  isRTL,
  flipToFit,
}) {
  const itemRef = useRef(null);

  if (action.divider) {
    return <Divider />;
  }

  const hasChildren = action.children && action.children.length > 0;
  const isExpanded = expanded === action.id;

  const handleClick = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(isExpanded ? null : action.id);
    } else {
      action.onClick?.();
      (closeAll ?? onClose)?.();
    }
  };

  return (
    <>
      <MenuItem
        ref={itemRef}
        disabled={action.disabled}
        onClick={handleClick}
        sx={{
          color: action.danger ? 'error.main' : 'inherit',
          minHeight: 28,
          px: 0.75,
          py: 0.25,
        }}
      >
        {action.icon && (
          <ListItemIcon
            sx={{
              minWidth: 24,
              color: action.danger ? 'error.main' : 'inherit',
            }}
          >
            {action.icon}
          </ListItemIcon>
        )}
        <ListItemText
          primary={resolveMenuLabel(action, t)}
          secondary={action.hint}
          primaryTypographyProps={{ sx: { fontSize: '0.85rem' } }}
          secondaryTypographyProps={{ variant: 'caption', sx: { color: 'text.secondary' } }}
        />
        {action.trailingActions && action.trailingActions.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 0.5 }}>
            {action.trailingActions.map((ta, taIdx) => (
              <TrailingActionButton key={taIdx} action={ta} onClose={closeAll ?? onClose} />
            ))}
          </Box>
        )}
        {action.trailing && (
          <Box onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
            {action.trailing}
          </Box>
        )}
        {hasChildren && (
          cascade
            ? (isRTL ? <ChevronLeft size={14} style={{ opacity: 0.6 }} /> : <ChevronRight size={14} style={{ opacity: 0.6 }} />)
            : isExpanded
              ? <ChevronUp size={14} style={{ opacity: 0.6 }} />
              : <ChevronDown size={14} style={{ opacity: 0.6 }} />
        )}
      </MenuItem>
      {cascade && hasChildren && (
        <AppMenu
          open={isExpanded}
          anchorEl={itemRef.current}
          onClose={() => onToggle(null)}
          closeAll={closeAll ?? onClose}
          actions={action.children}
          t={t}
          isRTL={isRTL}
          cascade
          flipToFit={flipToFit}
          transitionDuration={0}
          anchorOrigin={{
            vertical: 'top',
            horizontal: isRTL ? 'left' : 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: isRTL ? 'right' : 'left',
          }}
          slotProps={{
            root: { style: { pointerEvents: 'none' } },
            backdrop: {
              invisible: true,
              style: { pointerEvents: 'none' },
            },
          }}
          disableAutoFocus
          disableAutoFocusItem
        />
      )}
      {!cascade && hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              pl: 2.5,
              pr: 0.75,
              bgcolor: 'action.hover',
            }}
          >
            {action.children.map((child, idx) => {
              if (child.divider) return <Divider key={`sub-divider-${idx}`} sx={{ my: 0.5 }} />;
              return (
                <MenuItem
                  key={child.id || idx}
                  disabled={child.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    child.onClick?.();
                    (closeAll ?? onClose)?.();
                  }}
                  sx={{
                    color: child.danger ? 'error.main' : 'inherit',
                    minHeight: 26,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                  }}
                >
                  {child.icon && (
                    <ListItemIcon
                      sx={{
                        minWidth: 24,
                        color: child.danger ? 'error.main' : 'inherit',
                      }}
                    >
                      {child.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={resolveMenuLabel(child, t)}
                    secondary={child.hint}
                    primaryTypographyProps={{ sx: { fontSize: '0.85rem' } }}
                    secondaryTypographyProps={{ variant: 'caption', sx: { color: 'text.secondary' } }}
                  />
                  {child.trailingActions && child.trailingActions.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 0.5 }}>
                      {child.trailingActions.map((ta, taIdx) => (
                        <TrailingActionButton key={taIdx} action={ta} onClose={closeAll ?? onClose} />
                      ))}
                    </Box>
                  )}
                  {child.trailing && (
                    <Box onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                      {child.trailing}
                    </Box>
                  )}
                </MenuItem>
              );
            })}
          </Box>
        </Collapse>
      )}
    </>
  );
}

export default function AppMenu({
  open,
  anchorEl,
  onClose,
  closeAll,
  actions = [],
  t = (k) => k,
  isRTL: isRTLProp,
  slotProps: slotPropsProp,
  flipToFit = false,
  flipThreshold = 250,
  cascade = false,
  ...menuProps
}) {
  const [expanded, setExpanded] = useState(null);
  const isRTL = isRTLProp ?? menuProps?.anchorOrigin?.horizontal === 'left';

  const { anchorOrigin: anchorOriginProp, transformOrigin: transformOriginProp, ...restMenuProps } = menuProps;
  const { paper: paperSlotProps, ...restSlotProps } = slotPropsProp || {};

  const placement = useMemo(() => {
    if (!flipToFit || !open || !anchorEl || typeof window === 'undefined') {
      return {
        anchorOrigin: anchorOriginProp,
        transformOrigin: transformOriginProp,
        paperMaxHeight: undefined,
      };
    }
    const resolveEl = () => {
      if (anchorEl instanceof Element) return anchorEl;
      if (typeof anchorEl === 'function') return anchorEl();
      if (anchorEl?.current instanceof Element) return anchorEl.current;
      return null;
    };
    const el = resolveEl();
    if (!el) {
      return {
        anchorOrigin: anchorOriginProp,
        transformOrigin: transformOriginProp,
        paperMaxHeight: undefined,
      };
    }
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const margin = 16;
    const spaceBelow = Math.max(0, vh - rect.top - margin);
    const spaceAbove = Math.max(0, rect.top - margin);

    if (spaceBelow < flipThreshold && spaceAbove > spaceBelow) {
      return {
        anchorOrigin: { ...anchorOriginProp, vertical: 'top' },
        transformOrigin: { ...transformOriginProp, vertical: 'bottom' },
        paperMaxHeight: Math.min(spaceAbove, 0.8 * vh),
      };
    }

    return {
      anchorOrigin: { ...anchorOriginProp, vertical: 'top' },
      transformOrigin: { ...transformOriginProp, vertical: 'top' },
      paperMaxHeight: Math.min(spaceBelow, 0.8 * vh),
    };
  }, [flipToFit, open, anchorEl, anchorOriginProp, transformOriginProp, flipThreshold]);

  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  const handleItemToggle = useCallback((next) => {
    setExpanded(next);
  }, []);

  return (
    <Menu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={placement.anchorOrigin}
      transformOrigin={placement.transformOrigin}
      transitionDuration={cascade ? 0 : undefined}
      slotProps={{
        paper: {
          ...paperSlotProps,
          sx: {
            minWidth: 160,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 0.75,
            maxHeight: placement.paperMaxHeight ? `${placement.paperMaxHeight}px` : '80vh',
            overflow: 'auto',
            pointerEvents: 'auto',
            '& .MuiMenuItem-root': {
              whiteSpace: 'nowrap',
            },
            ...paperSlotProps?.sx,
          },
        },
        ...restSlotProps,
      }}
      disableAutoFocus
      disableAutoFocusItem
      {...restMenuProps}
    >
      {actions.map((action, index) => (
        <AppMenuItem
          key={action.id || `item-${index}`}
          action={action}
          t={t}
          onClose={onClose}
          closeAll={closeAll ?? onClose}
          expanded={expanded}
          onToggle={handleItemToggle}
          cascade={cascade}
          isRTL={isRTL}
          flipToFit={flipToFit}
        />
      ))}
    </Menu>
  );
}
