import React from 'react';
import InfoTooltip from './InfoTooltip';
import { withKnobs, text } from '@storybook/addon-knobs';
import { withA11y } from '@storybook/addon-a11y';

export default {
  title: 'Components/UI/InfoTooltip',
  component: InfoTooltip,
  decorators: [withKnobs, withA11y],
  parameters: {
    componentSubtitle: 'A reusable info tooltip component with click-to-show functionality',
    docs: {
      description: {
        component: `A customizable tooltip component that shows additional information when the info icon is clicked.
        Supports localization and is fully accessible.`
      },
    },
  },
};

// Mock translation function for Storybook
const t = (key) => ({
  'info_tooltip.trigger_aria_label': 'Show information',
  'submissions.tooltip': 'Includes: Quizzes, Homework assignments, Projects, Essays, Lab reports, and other course-related work',
})[key] || key;

// Mock useLang hook for Storybook
const useLang = () => ({ t });

// Mock the module for Storybook
jest.mock('../../../contexts/LangContext', () => ({
  useLang: () => useLang(),
}));

export const Default = () => (
  <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <span>Hover over the info icon</span>
    <InfoTooltip contentKey="submissions.tooltip" />
  </div>
);

export const WithCustomContent = () => (
  <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <span>Custom tooltip content</span>
    <InfoTooltip>
      This is custom tooltip content that can include <strong>HTML</strong> and multiple lines
      of text. It will be shown when the info icon is clicked.
    </InfoTooltip>
  </div>
);

WithCustomContent.story = {
  name: 'With Custom Content',
  parameters: {
    docs: {
      description: {
        story: 'Example of using the tooltip with custom JSX content instead of a translation key.'
      },
    },
  },
};

export const InDifferentPositions = () => (
  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span>Top position (default)</span>
      <InfoTooltip contentKey="submissions.tooltip" />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span>Right position (custom class can be added)</span>
      <InfoTooltip contentKey="submissions.tooltip" />
    </div>
  </div>
);

InDifferentPositions.story = {
  name: 'In Different Positions',
  parameters: {
    docs: {
      description: {
        story: 'Example showing how the tooltip can be positioned in different locations.'
      },
    },
  },
};
