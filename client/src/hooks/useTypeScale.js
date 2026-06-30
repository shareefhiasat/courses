/**
 * Returns CSS variable references for inline style usage.
 */
export function useTypeScale() {
  return {
    caption: 'var(--font-size-xs)',
    label: 'var(--font-size-sm)',
    body: 'var(--font-size-md)',
    title: 'var(--font-size-lg)',
    heading: 'var(--font-size-2xl)',
    iconXs: 'var(--icon-size-xs)',
    iconSm: 'var(--icon-size-sm)',
    iconMd: 'var(--icon-size-md)',
    iconLg: 'var(--icon-size-lg)',
    iconXl: 'var(--icon-size-xl)',
  };
}

export default useTypeScale;
