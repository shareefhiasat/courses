/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'README',
    {
      type: 'category',
      label: 'DevOps & Infrastructure',
      items: [
        'devops/README',
        'devops/monitoring-stack',
      ],
    },
    {
      type: 'category',
      label: 'Database',
      items: [
        'database/README',
        'database/DATABASE_SETUP',
      ],
    },
    {
      type: 'category',
      label: 'Authentication',
      items: [
        'authentication/README',
        'authentication/keycloak-setup',
      ],
    },
    {
      type: 'category',
      label: 'Components & Utilities',
      items: [
        'components/README',
        'components/components-filters',
        'components/feature-flags',
        'components/utils',
      ],
    },
    {
      type: 'category',
      label: 'User Guides',
      items: [
        'guides/testing',
        'guides/analytics-dashboard',
        'guides/widget-architecture',
        'guides/widget-storage',
      ],
    },
    {
      type: 'category',
      label: 'Setup & Migration',
      items: [
        'setup/README',
      ],
    },
    {
      type: 'category',
      label: 'API Documentation',
      items: [
        'api/creating-services',
      ],
    },
    {
      type: 'category',
      label: 'Legacy Documentation',
      items: [
        'docs/intro',
        'docs/getting-started/installation',
        'docs/api/creating-services',
      ],
    },
  ],
};

module.exports = sidebars;
