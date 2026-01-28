import React from 'react';
import HelpDrawer from './HelpDrawer';

export default {
  title: 'Shared/Common/HelpDrawer',
  component: HelpDrawer,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => {
    // Mock HelpContext for Storybook
    const MockHelpProvider = ({ children }) => {
      const mockHelpContext = {
        isOpen: true,
        currentHelp: {
          title: 'Getting Started',
          sections: [
            {
              id: 'overview',
              title: 'Overview',
              content: 'This is the help system overview. Here you can find information about how to use the application.',
              subsections: [
                {
                  id: 'navigation',
                  title: 'Navigation',
                  content: 'Use the sidebar to navigate between different sections of the application.'
                },
                {
                  id: 'search',
                  title: 'Search',
                  content: 'Use the search bar to quickly find what you need.'
                }
              ]
            },
            {
              id: 'features',
              title: 'Features',
              content: 'Learn about the main features of the application.',
              subsections: [
                {
                  id: 'dashboard',
                  title: 'Dashboard',
                  content: 'The dashboard provides an overview of your data and activities.'
                },
                {
                  id: 'reports',
                  title: 'Reports',
                  content: 'Generate and view various reports and analytics.'
                }
              ]
            },
            {
              id: 'troubleshooting',
              title: 'Troubleshooting',
              content: 'Common issues and their solutions.',
              subsections: [
                {
                  id: 'login-issues',
                  title: 'Login Issues',
                  content: 'If you cannot log in, check your credentials and try again.'
                },
                {
                  id: 'data-sync',
                  title: 'Data Sync Issues',
                  content: 'Data sync problems are usually resolved by refreshing the page.'
                }
              ]
            }
          ]
        },
        closeHelp: () => console.log('Help drawer closed')
      };

      // Mock the useHelp hook
      React.useEffect(() => {
        // This would normally be provided by HelpContext
        window.mockHelpContext = mockHelpContext;
      }, []);

      return children;
    };

    return (
      <MockHelpProvider>
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
          <h2>Help Drawer Example</h2>
          <p>The help drawer should be visible on the right side of the screen.</p>
          <HelpDrawer />
        </div>
      </MockHelpProvider>
    );
  },
};

export const WithSearch = {
  render: () => {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <h2>Help Drawer with Search</h2>
        <p>Try searching for terms like "navigation", "dashboard", or "login".</p>
        <HelpDrawer />
      </div>
    );
  },
};

export const CollapsedSections = {
  render: () => {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <h2>Help Drawer with Collapsible Sections</h2>
        <p>Click on section headers to expand/collapse content.</p>
        <HelpDrawer />
      </div>
    );
  },
};
