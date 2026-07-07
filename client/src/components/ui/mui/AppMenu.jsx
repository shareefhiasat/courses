import React, { useState, useEffect } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
          primary={t(action.label) || action.label}
          secondary={action.hint}
          secondaryTypographyProps={{ variant: 'caption', sx: { color: 'text.secondary' } }}
        />
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
                    primary={t(child.label) || child.label}
                    secondary={child.hint}
                    secondaryTypographyProps={{ variant: 'caption', sx: { color: 'text.secondary' } }}
                  />
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
