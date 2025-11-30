import React, { useState } from 'react';
import NumberInput from './NumberInput';

export default {
  title: 'Form/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'Number value',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    min: {
      control: 'number',
      description: 'Minimum value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    step: {
      control: 'number',
      description: 'Step increment',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    required: {
      control: 'boolean',
      description: 'Required field',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
  },
};

const Template = (args) => {
  const [value, setValue] = useState(args.value || 0);
  
  return (
    <div style={{ maxWidth: 400, padding: '2rem' }}>
      <NumberInput
        {...args}
        value={value}
        onChange={(e) => {
          const newValue = parseInt(e.target.value) || 0;
          setValue(newValue);
          console.log('Number value:', newValue);
        }}
      />
      <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: 4, fontSize: '0.875rem' }}>
        <strong>Current Value:</strong> {value}
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  label: 'Quantity',
  placeholder: 'Enter quantity',
  value: 1,
};

export const WithMinMax = Template.bind({});
WithMinMax.args = {
  label: 'Age',
  placeholder: 'Enter your age',
  min: 18,
  max: 100,
  value: 25,
  helperText: 'Must be between 18 and 100',
};

export const WithStep = Template.bind({});
WithStep.args = {
  label: 'Price',
  placeholder: 'Enter price',
  min: 0,
  step: 0.5,
  value: 10,
  helperText: 'Increments of 0.5',
};

export const Score = Template.bind({});
Score.args = {
  label: 'Max Score',
  placeholder: 'Enter maximum score',
  min: 1,
  max: 100,
  value: 10,
  helperText: 'Score range: 1-100',
};

export const Year = Template.bind({});
Year.args = {
  label: 'Year',
  placeholder: 'Enter year',
  min: 2020,
  max: 2030,
  value: 2024,
};

export const Port = Template.bind({});
Port.args = {
  label: 'SMTP Port',
  placeholder: '587',
  min: 1,
  max: 65535,
  value: 587,
  helperText: 'Common ports: 25, 465, 587',
};

export const Duration = Template.bind({});
Duration.args = {
  label: 'Session Duration (minutes)',
  placeholder: 'Enter duration',
  min: 5,
  max: 180,
  step: 5,
  value: 15,
  helperText: 'Duration in 5-minute increments',
};

export const Required = Template.bind({});
Required.args = {
  label: 'Student Count',
  placeholder: 'Required field',
  min: 1,
  required: true,
  value: 30,
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Participants',
  placeholder: 'Enter number',
  min: 10,
  max: 50,
  value: 5,
  error: 'Must be at least 10 participants',
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Number Input',
  placeholder: 'Cannot edit',
  disabled: true,
  value: 42,
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  label: 'Full Width Number Input',
  placeholder: 'Spans full container width',
  fullWidth: true,
  value: 100,
};

export const WithSpinners = Template.bind({});
WithSpinners.args = {
  label: 'Counter',
  placeholder: 'Use arrows to adjust',
  min: 0,
  max: 999,
  value: 50,
  helperText: 'Click arrows or type a number',
};

export const DarkMode = Template.bind({});
DarkMode.args = {
  label: 'Dark Mode Number Input',
  placeholder: 'Enter number',
  min: 0,
  max: 100,
  value: 75,
};
DarkMode.decorators = [
  (Story) => (
    <div style={{ background: '#1a1a1a', padding: '2rem', minHeight: '400px' }}>
      <Story />
    </div>
  ),
];
