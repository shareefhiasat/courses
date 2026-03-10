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
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/docker-setup',
        'getting-started/environment-variables',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/service-layers',
        'architecture/database-design',
        'architecture/security',
        'architecture/logging-monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Services',
      items: [
        'services/overview',
        'services/categories',
        'services/programs',
        'services/subjects',
        'services/classes',
        'services/activities',
        'services/announcements',
        'services/resources',
        'services/users',
      ],
    },
    {
      type: 'category',
      label: 'API Development',
      items: [
        'api/creating-services',
        'api/middleware',
        'api/error-handling',
        'api/authentication',
        'api/rate-limiting',
        'api/testing',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/docker',
        'deployment/elk-stack',
        'deployment/monitoring',
        'deployment/production',
      ],
    },
    {
      type: 'category',
      label: 'Migration Guide',
      items: [
        'migration/firebase-to-mongodb',
        'migration/service-templates',
        'migration/checklist',
      ],
    },
  ],
};

module.exports = sidebars;
