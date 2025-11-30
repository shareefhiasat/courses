import React from 'react';
import Button from './Button';
import { Plus, Trash2, Download, Save } from 'lucide-react';

export default {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Visual style of the button',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in loading state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the button takes full width',
    },
  },
};

// Default story
export const Primary = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    size: 'medium',
  },
};

export const Secondary = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Danger = {
  args: {
    children: 'Delete',
    variant: 'danger',
  },
};

// Sizes
export const Small = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
};

export const Medium = {
  args: {
    children: 'Medium Button',
    size: 'medium',
  },
};

export const Large = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
};

// States
export const Disabled = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Loading = {
  args: {
    children: 'Loading...',
    loading: true,
  },
};

export const FullWidth = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
};

// With Icons
export const WithIconLeft = {
  args: {
    children: (
      <>
        <Plus size={16} />
        Add Item
      </>
    ),
  },
};

export const WithIconRight = {
  args: {
    children: (
      <>
        Download
        <Download size={16} />
      </>
    ),
  },
};

export const IconOnly = {
  args: {
    children: <Trash2 size={16} />,
    variant: 'danger',
    size: 'small',
  },
};

// All Variants Showcase
export const AllVariants = () => (
  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
  </div>
);

// All Sizes Showcase
export const AllSizes = () => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
    <Button size="small">Small</Button>
    <Button size="medium">Medium</Button>
    <Button size="large">Large</Button>
  </div>
);

// Real-world Examples
export const FormActions = () => (
  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary" type="submit">
      <Save size={16} />
      Save Changes
    </Button>
  </div>
);

export const DeleteConfirmation = () => (
  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
    <Button variant="outline">Cancel</Button>
    <Button variant="danger">
      <Trash2 size={16} />
      Delete
    </Button>
  </div>
);

export const LoadingStates = () => (
  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    <Button loading>Saving...</Button>
    <Button variant="secondary" loading>Processing...</Button>
    <Button variant="outline" loading>Loading...</Button>
  </div>
);
