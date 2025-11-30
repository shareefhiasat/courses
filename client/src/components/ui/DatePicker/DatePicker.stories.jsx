import React, { useState } from 'react';
import DatePicker from './DatePicker';

export default {
  title: 'Form/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['date', 'time', 'datetime'],
      description: 'Type of date picker',
    },
    value: {
      control: 'text',
      description: 'ISO 8601 date string',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
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
    min: {
      control: 'text',
      description: 'Minimum date (ISO 8601)',
    },
    max: {
      control: 'text',
      description: 'Maximum date (ISO 8601)',
    },
  },
};

const Template = (args) => {
  const [value, setValue] = useState(args.value || '');
  
  return (
    <div style={{ maxWidth: 400, padding: '2rem' }}>
      <DatePicker
        {...args}
        value={value}
        onChange={(isoString) => {
          setValue(isoString);
          console.log('Selected date:', isoString);
        }}
      />
      <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: 4, fontSize: '0.875rem' }}>
        <strong>Selected Value:</strong> {value || 'None'}
      </div>
    </div>
  );
};

export const DateOnly = Template.bind({});
DateOnly.args = {
  type: 'date',
  label: 'Select Date',
  placeholder: 'Choose a date',
};

export const TimeOnly = Template.bind({});
TimeOnly.args = {
  type: 'time',
  label: 'Select Time',
  placeholder: 'Choose a time',
};

export const DateTime = Template.bind({});
DateTime.args = {
  type: 'datetime',
  label: 'Select Date & Time',
  placeholder: 'Choose date and time',
};

export const WithMinMax = Template.bind({});
WithMinMax.args = {
  type: 'date',
  label: 'Booking Date',
  placeholder: 'Select booking date',
  min: new Date().toISOString().split('T')[0],
  max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  helperText: 'Available for next 30 days',
};

export const Required = Template.bind({});
Required.args = {
  type: 'date',
  label: 'Birth Date',
  placeholder: 'Enter your birth date',
  required: true,
};

export const WithError = Template.bind({});
WithError.args = {
  type: 'date',
  label: 'Event Date',
  placeholder: 'Select event date',
  error: 'Date must be in the future',
  value: '2020-01-01',
};

export const Disabled = Template.bind({});
Disabled.args = {
  type: 'date',
  label: 'Disabled Date',
  placeholder: 'Cannot select',
  disabled: true,
  value: '2024-01-15',
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  type: 'date',
  label: 'Full Width Date Picker',
  placeholder: 'Select date',
  fullWidth: true,
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  type: 'date',
  label: 'Date with Calendar Icon',
  placeholder: 'Pick a date',
  showIcon: true,
};

export const DarkMode = Template.bind({});
DarkMode.args = {
  type: 'datetime',
  label: 'Dark Mode Example',
  placeholder: 'Select date and time',
};
DarkMode.decorators = [
  (Story) => (
    <div style={{ background: '#1a1a1a', padding: '2rem', minHeight: '400px' }}>
      <Story />
    </div>
  ),
];
