export default {
  logo: (
    <>
      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>❖ Military LMS</span>
      <span style={{ marginInlineStart: 8, opacity: 0.6, fontSize: '0.9rem' }}>
        Help Center
      </span>
    </>
  ),
  footer: {
    text: 'Military LMS Help Center',
  },
  search: {
    placeholder: 'Search help articles...',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Military LMS Help',
    }
  },
  darkMode: true,
  primaryHue: 217,
  feedback: {
    content: null,
  },
  editLink: {
    component: () => null,
  },
}
