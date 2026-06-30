import { createTheme } from '@mui/material/styles';

/**
 * Global MUI theme — typography inherits CSS variables from TypographyContext.
 * @param {{ direction?: 'ltr' | 'rtl', mode?: 'light' | 'dark' }} options
 */
export function createAppMuiTheme({ direction = 'ltr', mode = 'light' } = {}) {
  return createTheme({
    direction,
    palette: { mode },
    typography: {
      fontFamily: 'var(--font-family-sans)',
      h1: { fontFamily: 'var(--font-family-sans)' },
      h2: { fontFamily: 'var(--font-family-sans)' },
      h3: { fontFamily: 'var(--font-family-sans)' },
      h4: { fontFamily: 'var(--font-family-sans)' },
      h5: { fontFamily: 'var(--font-family-sans)' },
      h6: { fontFamily: 'var(--font-family-sans)' },
      body1: { lineHeight: 'var(--line-height-body)' },
      body2: { lineHeight: 'var(--line-height-body)' },
      button: { textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: 'var(--font-family-sans)',
            lineHeight: 'var(--line-height-body)',
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-family-sans)',
          },
        },
      },
    },
  });
}
