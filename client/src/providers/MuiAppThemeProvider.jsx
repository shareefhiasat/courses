import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { createAppMuiTheme } from '@/theme/muiTheme';

export default function MuiAppThemeProvider({ children }) {
  const { isRTL } = useLang();
  const { theme } = useTheme();

  const muiTheme = useMemo(
    () => createAppMuiTheme({
      direction: isRTL ? 'rtl' : 'ltr',
      mode: theme === 'dark' ? 'dark' : 'light',
    }),
    [isRTL, theme],
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
