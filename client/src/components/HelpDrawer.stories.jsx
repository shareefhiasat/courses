import React from 'react';
import HelpDrawer from './HelpDrawer';
import { HelpProvider } from '../contexts/HelpContext';
import { LangProvider } from '../contexts/LangContext';

export default {
  title: 'Components/HelpDrawer',
  component: HelpDrawer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <LangProvider>
        <HelpProvider>
          <Story />
        </HelpProvider>
      </LangProvider>
    ),
  ],
};

// Mock help content for stories
const mockHelpContent = {
  title: 'Help & Support',
  content: [
    {
      title: 'Penalty Rules',
      items: [
        {
          text: 'Cheating',
          deduction: '-10 points',
          description: 'Severe penalty for academic dishonesty during exams or assignments.'
        },
        {
          text: 'Late Submission',
          deduction: '-5 points',
          description: 'Deduction for assignments submitted after the deadline.'
        },
        {
          text: 'Disruptive Behavior',
          deduction: '-3 points',
          description: 'Penalty for behavior that disrupts the learning environment.'
        }
      ]
    },
    {
      title: 'Absence Rules',
      items: [
        {
          text: 'With Excuse',
          deduction: '-2 points per session',
          description: 'Absence with valid medical or official excuse.'
        },
        {
          text: 'Without Excuse',
          deduction: '-5 points per session',
          description: 'Unexcused absence from class.'
        }
      ]
    },
    {
      title: 'Participation Rules',
      items: [
        {
          text: 'Explained Lesson',
          points: '+5 points',
          description: 'Points awarded for explaining a lesson to classmates.'
        },
        {
          text: 'Gave Project',
          points: '+10 points',
          description: 'Points for presenting a project.'
        },
        {
          text: 'Answered Question',
          points: '+2 points',
          description: 'Points for actively answering questions in class.'
        }
      ]
    }
  ]
};

export const Default = {
  args: {},
  decorators: [
    (Story) => {
      React.useEffect(() => {
        // Open the help drawer after mount
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app:help', {
            detail: { route: '/hr-penalties' }
          }));
        }, 100);
        return () => clearTimeout(timer);
      }, []);
      return <Story />;
    },
  ],
};

export const WithSearch = {
  args: {},
  decorators: [
    (Story) => {
      React.useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app:help', {
            detail: { route: '/hr-penalties' }
          }));
        }, 100);
        return () => clearTimeout(timer);
      }, []);
      return <Story />;
    },
  ],
};

export const CollapsedSections = {
  args: {},
  decorators: [
    (Story) => {
      React.useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app:help', {
            detail: { route: '/hr-penalties' }
          }));
        }, 100);
        return () => clearTimeout(timer);
      }, []);
      return <Story />;
    },
  ],
};

export const EmptyContent = {
  args: {},
  decorators: [
    (Story) => {
      React.useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app:help', {
            detail: { route: '/unknown-route' }
          }));
        }, 100);
        return () => clearTimeout(timer);
      }, []);
      return <Story />;
    },
  ],
};

