import { createTheme } from '@mui/material/styles';

/**
 * Global MUI theme — typography uses CSS type tokens.
 * @param {{ direction?: 'ltr' | 'rtl', mode?: 'light' | 'dark' }} options
 */
export function createAppMuiTheme({ direction = 'ltr', mode = 'light' } = {}) {
  return createTheme({
    direction,
    palette: { mode },
    typography: {
      fontFamily: 'var(--font-family-sans)',
      fontSize: 14,
      h1: { fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-4xl)' },
      h2: { fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-3xl)' },
      h3: { fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-2xl)' },
      h4: { fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-xl)' },
      h5: { fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-lg)' },
      h6: { fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-lg)' },
      body1: { fontSize: 'var(--font-size-md)', lineHeight: 'var(--line-height-body)' },
      body2: { fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-body)' },
      caption: { fontSize: 'var(--font-size-xs)' },
      button: { fontSize: 'var(--font-size-sm)', textTransform: 'none' },
      subtitle1: { fontSize: 'var(--font-size-md)' },
      subtitle2: { fontSize: 'var(--font-size-sm)' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--font-size-md)',
            lineHeight: 'var(--line-height-body)',
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--font-size-sm)',
          },
          columnHeaderTitle: {
            fontSize: 'var(--font-size-sm)',
          },
          cell: {
            fontSize: 'var(--font-size-sm)',
          },
          row: {
            minHeight: 'calc(var(--grid-row-height, 36px) * var(--type-multiplier, 1)) !important',
            maxHeight: 'calc(var(--grid-row-height, 36px) * var(--type-multiplier, 1)) !important',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontSize: 'var(--font-size-sm)',
            minHeight: 'calc(2.25 * var(--type-base))',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            fontSize: 'var(--font-size-md)',
          },
        },
      },
    },
  });
}
