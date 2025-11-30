import React from 'react';
import Loading from './Loading';

export default {
  title: 'Feedback/Loading',
  component: Loading,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['spinner', 'fancy', 'overlay', 'fullscreen', 'inline'],
      description: 'Loading variant style',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the loading indicator',
    },
    text: {
      control: 'text',
      description: 'Loading text message',
    },
    color: {
      control: 'color',
      description: 'Custom color for spinner',
    },
  },
};

const Template = (args) => (
  <div style={{ padding: '2rem', minHeight: 300, position: 'relative' }}>
    <Loading {...args} />
  </div>
);

export const Spinner = Template.bind({});
Spinner.args = {
  variant: 'spinner',
  size: 'md',
  text: 'Loading...',
};

export const SmallSpinner = Template.bind({});
SmallSpinner.args = {
  variant: 'spinner',
  size: 'sm',
  text: 'Loading',
};

export const LargeSpinner = Template.bind({});
LargeSpinner.args = {
  variant: 'spinner',
  size: 'lg',
  text: 'Please wait...',
};

export const FancyLoader = Template.bind({});
FancyLoader.args = {
  variant: 'fancy',
  size: 'lg',
  text: 'Loading your data...',
};

export const InlineLoader = Template.bind({});
InlineLoader.args = {
  variant: 'inline',
  size: 'sm',
  text: 'Saving...',
};

export const OverlayLoader = () => (
  <div style={{ position: 'relative', height: 400, background: '#f5f5f5', borderRadius: 8, padding: '2rem' }}>
    <h3>Content Behind Overlay</h3>
    <p>This content is blocked by the loading overlay.</p>
    <Loading variant="overlay" size="lg" text="Processing your request..." />
  </div>
);

export const FullscreenLoader = () => (
  <div style={{ position: 'relative', height: 500, background: '#f5f5f5', borderRadius: 8 }}>
    <Loading variant="fullscreen" size="xl" text="Loading application..." />
  </div>
);

export const WithoutText = Template.bind({});
WithoutText.args = {
  variant: 'spinner',
  size: 'md',
};

export const CustomColor = Template.bind({});
CustomColor.args = {
  variant: 'spinner',
  size: 'lg',
  text: 'Custom colored loader',
  color: '#800020',
};

export const LoadingStates = () => (
  <div style={{ padding: '2rem' }}>
    <h3 style={{ marginTop: 0 }}>Different Loading States</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
      <div>
        <h4>Loading Data</h4>
        <Loading variant="spinner" size="md" text="Loading data..." />
      </div>
      <div>
        <h4>Saving Changes</h4>
        <Loading variant="inline" size="sm" text="Saving..." />
      </div>
      <div>
        <h4>Processing</h4>
        <Loading variant="fancy" size="lg" text="Processing..." />
      </div>
      <div>
        <h4>Uploading</h4>
        <Loading variant="spinner" size="md" text="Uploading files..." />
      </div>
    </div>
  </div>
);

export const LoadingEmailLogs = Template.bind({});
LoadingEmailLogs.args = {
  variant: 'spinner',
  size: 'lg',
  text: 'Loading email logs...',
};

export const LoadingTemplates = Template.bind({});
LoadingTemplates.args = {
  variant: 'spinner',
  size: 'lg',
  text: 'Loading templates...',
};

export const LoadingUsers = Template.bind({});
LoadingUsers.args = {
  variant: 'fancy',
  size: 'lg',
  text: 'Loading users...',
};

export const DarkMode = Template.bind({});
DarkMode.args = {
  variant: 'spinner',
  size: 'lg',
  text: 'Loading in dark mode...',
};
DarkMode.decorators = [
  (Story) => (
    <div style={{ background: '#1a1a1a', padding: '2rem', minHeight: '400px' }}>
      <Story />
    </div>
  ),
];
