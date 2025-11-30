import React from 'react';
import Card, { CardHeader, CardBody, CardFooter } from './Card';
import Button from '../Button';
import { Settings, MoreVertical } from 'lucide-react';

export default {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    elevation: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Shadow depth of the card',
    },
    padding: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Internal padding of the card',
    },
    hoverable: {
      control: 'boolean',
      description: 'Whether card has hover effect',
    },
  },
};

// Basic Card
export const Basic = {
  args: {
    children: (
      <div>
        <h3>Card Title</h3>
        <p>This is a basic card with some content inside.</p>
      </div>
    ),
  },
};

// Card with Header, Body, Footer
export const WithSections = () => (
  <Card>
    <CardHeader
      title="User Profile"
      subtitle="Manage your account settings"
      actions={
        <Button variant="ghost" size="small">
          <Settings size={16} />
        </Button>
      }
    />
    <CardBody>
      <p>This is the main content area of the card.</p>
      <p>You can put any content here.</p>
    </CardBody>
    <CardFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Save Changes</Button>
    </CardFooter>
  </Card>
);

// Elevation Levels
export const ElevationLevels = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
    <Card elevation="sm">
      <h4>Small</h4>
      <p>Subtle shadow</p>
    </Card>
    <Card elevation="md">
      <h4>Medium</h4>
      <p>Default shadow</p>
    </Card>
    <Card elevation="lg">
      <h4>Large</h4>
      <p>Prominent shadow</p>
    </Card>
    <Card elevation="xl">
      <h4>Extra Large</h4>
      <p>Maximum shadow</p>
    </Card>
  </div>
);

// Padding Variants
export const PaddingVariants = () => (
  <div style={{ display: 'grid', gap: '1rem' }}>
    <Card padding="sm">
      <p><strong>Small Padding</strong> - Compact layout</p>
    </Card>
    <Card padding="md">
      <p><strong>Medium Padding</strong> - Default spacing</p>
    </Card>
    <Card padding="lg">
      <p><strong>Large Padding</strong> - Spacious layout</p>
    </Card>
  </div>
);

// Hoverable Card
export const Hoverable = {
  args: {
    hoverable: true,
    children: (
      <div>
        <h3>Hover Me!</h3>
        <p>This card lifts up when you hover over it.</p>
      </div>
    ),
  },
};

// Clickable Card
export const Clickable = {
  args: {
    onClick: () => alert('Card clicked!'),
    children: (
      <div>
        <h3>Click Me!</h3>
        <p>This entire card is clickable.</p>
      </div>
    ),
  },
};

// Activity Card Example
export const ActivityCard = () => (
  <Card hoverable>
    <CardHeader
      title="JavaScript Basics"
      subtitle="Due: Nov 20, 2025"
      actions={
        <Button variant="ghost" size="small">
          <MoreVertical size={16} />
        </Button>
      }
    />
    <CardBody>
      <p>Learn the fundamentals of JavaScript programming including variables, functions, and control flow.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <span style={{
          padding: '4px 12px',
          background: '#d4edda',
          color: '#155724',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          Beginner
        </span>
        <span style={{
          padding: '4px 12px',
          background: '#e7f3ff',
          color: '#0d6efd',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          Coding
        </span>
      </div>
    </CardBody>
    <CardFooter>
      <Button variant="primary" size="small">Start Activity</Button>
    </CardFooter>
  </Card>
);

// Stats Card Example
export const StatsCard = () => (
  <Card elevation="lg">
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '3rem',
        fontWeight: 'bold',
        color: 'var(--color-primary, #800020)',
        marginBottom: '0.5rem'
      }}>
        42
      </div>
      <div style={{ color: 'var(--muted, #666)', fontSize: '0.9rem' }}>
        Completed Activities
      </div>
    </div>
  </Card>
);

// Grid of Cards
export const CardGrid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} hoverable>
        <CardHeader title={`Card ${i}`} subtitle="Subtitle text" />
        <CardBody>
          <p>Card content goes here.</p>
        </CardBody>
      </Card>
    ))}
  </div>
);
