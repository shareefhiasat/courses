export default {
  logo: (
    <>
      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>❖ Military LMS</span>
      <span style={{ marginInlineStart: 8, opacity: 0.6, fontSize: '0.9rem' }}>
        Help Center
      </span>
    </>
  ),
  project: {
    link: 'https://github.com/shareefhiasat/courses',
  },
  docsRepositoryBase: 'https://github.com/shareefhiasat/courses/tree/main/help-docs',
  footer: {
    text: 'Military LMS Help Center',
  },
  search: {
    placeholder: 'Search help articles...',
  },
  i18n: [
    { locale: 'en', name: 'English', direction: 'ltr' },
    { locale: 'ar', name: 'العربية', direction: 'rtl' },
  ],
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Military LMS Help',
    }
  },
  darkMode: true,
  primaryHue: 217,
}
