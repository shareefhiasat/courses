import React from 'react';
import Badge from './Badge';

export default {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['success', 'warning', 'danger', 'info', 'primary', 'default'],
      description: 'Badge color',
    },
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'subtle'],
      description: 'Visual style',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Badge size',
    },
    dot: {
      control: 'boolean',
      description: 'Show as dot indicator',
    },
  },
};

// Default
export const Default = {
  args: {
    children: 'Badge',
    color: 'default',
  },
};

// Colors - Solid
export const AllColors = () => (
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    <Badge color="success">Success</Badge>
    <Badge color="warning">Warning</Badge>
    <Badge color="danger">Danger</Badge>
    <Badge color="info">Info</Badge>
    <Badge color="primary">Primary</Badge>
    <Badge color="default">Default</Badge>
  </div>
);

// Variants
export const AllVariants = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="solid" color="success">Solid</Badge>
      <Badge variant="solid" color="warning">Solid</Badge>
      <Badge variant="solid" color="danger">Solid</Badge>
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="outline" color="success">Outline</Badge>
      <Badge variant="outline" color="warning">Outline</Badge>
      <Badge variant="outline" color="danger">Outline</Badge>
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="subtle" color="success">Subtle</Badge>
      <Badge variant="subtle" color="warning">Subtle</Badge>
      <Badge variant="subtle" color="danger">Subtle</Badge>
    </div>
  </div>
);

// Sizes
export const AllSizes = () => (
  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
    <Badge size="small">Small</Badge>
    <Badge size="medium">Medium</Badge>
    <Badge size="large">Large</Badge>
  </div>
);

// Dot Indicators
export const DotIndicators = () => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Badge dot color="success" />
      <span>Online</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Badge dot color="warning" />
      <span>Away</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Badge dot color="danger" />
      <span>Offline</span>
    </div>
  </div>
);

// Real-world Examples
export const DifficultyLevels = () => (
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    <Badge variant="subtle" color="success">Beginner</Badge>
    <Badge variant="subtle" color="warning">Intermediate</Badge>
    <Badge variant="subtle" color="danger">Advanced</Badge>
  </div>
);

export const ActivityTypes = () => (
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    <Badge variant="subtle" color="info">Coding</Badge>
    <Badge variant="subtle" color="primary">Theory</Badge>
    <Badge variant="subtle" color="success">Quiz</Badge>
  </div>
);

export const StatusBadges = () => (
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
    <Badge color="success">Completed</Badge>
    <Badge color="warning">In Progress</Badge>
    <Badge color="danger">Overdue</Badge>
    <Badge color="default">Not Started</Badge>
  </div>
);

export const WithCounts = () => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span>Notifications</span>
      <Badge color="danger" size="small">5</Badge>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span>Messages</span>
      <Badge color="primary" size="small">12</Badge>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span>Updates</span>
      <Badge color="info" size="small">3</Badge>
    </div>
  </div>
);
