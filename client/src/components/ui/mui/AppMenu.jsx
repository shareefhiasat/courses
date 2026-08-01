import React, { useState, useEffect } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
          onClose?.();
        }}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 1,
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
  expanded,
  onToggle,
}) {
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
      onClose?.();
    }
  };

  return (
    <>
      <MenuItem
        disabled={action.disabled}
        onClick={handleClick}
        sx={{
          color: action.danger ? 'error.main' : 'inherit',
          pr: 1,
        }}
      >
        {action.icon && (
          <ListItemIcon
            sx={{
              minWidth: 32,
              color: action.danger ? 'error.main' : 'inherit',
            }}
          >
            {action.icon}
          </ListItemIcon>
        )}
        <ListItemText
          primary={resolveMenuLabel(action, t)}
          secondary={action.hint}
          secondaryTypographyProps={{ variant: 'caption', sx: { color: 'text.secondary' } }}
        />
        {action.trailingActions && action.trailingActions.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
            {action.trailingActions.map((ta, taIdx) => (
              <TrailingActionButton key={taIdx} action={ta} onClose={onClose} />
            ))}
          </Box>
        )}
        {hasChildren && (
          isExpanded
            ? <ChevronUp size={16} style={{ opacity: 0.6 }} />
            : <ChevronDown size={16} style={{ opacity: 0.6 }} />
        )}
      </MenuItem>
      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              pl: 3.5,
              pr: 1,
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
                    onClose?.();
                  }}
                  sx={{
                    color: child.danger ? 'error.main' : 'inherit',
                    minHeight: 36,
                    borderRadius: 1,
                    my: 0.25,
                  }}
                >
                  {child.icon && (
                    <ListItemIcon
                      sx={{
                        minWidth: 28,
                        color: child.danger ? 'error.main' : 'inherit',
                      }}
                    >
                      {child.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={resolveMenuLabel(child, t)}
                    secondary={child.hint}
                    secondaryTypographyProps={{ variant: 'caption', sx: { color: 'text.secondary' } }}
                  />
                  {child.trailingActions && child.trailingActions.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                      {child.trailingActions.map((ta, taIdx) => (
                        <TrailingActionButton key={taIdx} action={ta} onClose={onClose} />
                      ))}
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
  actions = [],
  t = (k) => k,
  isRTL: isRTLProp,
  slotProps,
  ...menuProps
}) {
  const [expanded, setExpanded] = useState(null);
  const isRTL = isRTLProp ?? menuProps?.anchorOrigin?.horizontal === 'left';

  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  return (
    <Menu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            minWidth: 220,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 1,
            maxHeight: '80vh',
            overflow: 'auto',
            '& .MuiMenuItem-root': {
              whiteSpace: 'nowrap',
            },
          },
        },
        ...slotProps,
      }}
      disableAutoFocus
      disableAutoFocusItem
      {...menuProps}
    >
      {actions.map((action, index) => (
        <AppMenuItem
          key={action.id || `item-${index}`}
          action={action}
          t={t}
          onClose={onClose}
          expanded={expanded}
          onToggle={setExpanded}
        />
      ))}
    </Menu>
  );
}
