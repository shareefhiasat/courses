import React, { useState } from 'react';
import DateRangeSlider from './DateRangeSlider';

export default {
  title: 'Form/DateRangeSlider',
  component: DateRangeSlider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A date range picker component with from/to dates, similar to BI tools. Supports showing either one or both date inputs.',
      },
    },
  },
  argTypes: {
    fromDate: { control: 'text' },
    toDate: { control: 'text' },
    showFrom: { control: 'boolean' },
    showTo: { control: 'boolean' },
    placeholderFrom: { control: 'text' },
    placeholderTo: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    clearable: { control: 'boolean' },
  },
};

// Template with state management
const Template = (args) => {
  const [dates, setDates] = useState({
    fromDate: args.fromDate || '',
    toDate: args.toDate || '',
  });

  return (
    <div style={{ maxWidth: '600px', padding: '2rem' }}>
      <DateRangeSlider
        {...args}
        fromDate={dates.fromDate}
        toDate={dates.toDate}
        onChange={(newDates) => {
          setDates(newDates);
          console.log('Date range changed:', newDates);
        }}
      />
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', fontSize: '0.875rem' }}>
        <strong>Selected Dates:</strong>
        <div>From: {dates.fromDate || 'Not set'}</div>
        <div>To: {dates.toDate || 'Not set'}</div>
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  label: 'Date Range',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  showFrom: true,
  showTo: true,
  fullWidth: true,
  clearable: true,
};

export const WithInitialValues = Template.bind({});
WithInitialValues.args = {
  label: 'Date Range',
  fromDate: '2025-01-01',
  toDate: '2025-01-31',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  showFrom: true,
  showTo: true,
  fullWidth: true,
  clearable: true,
};

export const FromDateOnly = Template.bind({});
FromDateOnly.args = {
  label: 'Start Date',
  placeholderFrom: 'From Date',
  showFrom: true,
  showTo: false,
  fullWidth: true,
  clearable: true,
};

export const ToDateOnly = Template.bind({});
ToDateOnly.args = {
  label: 'End Date',
  placeholderTo: 'To Date',
  showFrom: false,
  showTo: true,
  fullWidth: true,
  clearable: true,
};

export const Required = Template.bind({});
Required.args = {
  label: 'Date Range (Required)',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  showFrom: true,
  showTo: true,
  required: true,
  fullWidth: true,
  clearable: true,
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Date Range',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  showFrom: true,
  showTo: true,
  error: 'Please select a valid date range',
  fullWidth: true,
  clearable: true,
};

export const WithHelperText = Template.bind({});
WithHelperText.args = {
  label: 'Date Range',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  showFrom: true,
  showTo: true,
  helperText: 'Select a date range to filter the results',
  fullWidth: true,
  clearable: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Date Range',
  fromDate: '2025-01-01',
  toDate: '2025-01-31',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  showFrom: true,
  showTo: true,
  disabled: true,
  fullWidth: true,
  clearable: true,
};

export const NotClearable = Template.bind({});
NotClearable.args = {
  label: 'Date Range',
  fromDate: '2025-01-01',
  toDate: '2025-01-31',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  showFrom: true,
  showTo: true,
  clearable: false,
  fullWidth: true,
};

export const Compact = Template.bind({});
Compact.args = {
  placeholderFrom: 'From',
  placeholderTo: 'To',
  showFrom: true,
  showTo: true,
  fullWidth: false,
  clearable: true,
};

