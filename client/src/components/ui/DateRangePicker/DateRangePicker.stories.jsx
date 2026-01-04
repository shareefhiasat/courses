import React, { useState } from 'react';
import DateRangePicker from './DateRangePicker';

export default {
  title: 'Form/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A beautiful shadcn-style date range picker using react-day-picker. Features multi-month view, range selection, and modern UI.',
      },
    },
  },
  argTypes: {
    fromDate: { control: 'text' },
    toDate: { control: 'text' },
    placeholderFrom: { control: 'text' },
    placeholderTo: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    clearable: { control: 'boolean' },
    numberOfMonths: { control: { type: 'number', min: 1, max: 3 } },
  },
};

const Template = (args) => {
  const [dates, setDates] = useState({
    fromDate: args.fromDate || '',
    toDate: args.toDate || '',
  });

  return (
    <div style={{ maxWidth: '600px', padding: '2rem' }}>
      <DateRangePicker
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
  fullWidth: true,
  clearable: true,
  numberOfMonths: 2,
};

export const WithInitialValues = Template.bind({});
WithInitialValues.args = {
  label: 'Date Range',
  fromDate: '2025-01-01',
  toDate: '2025-01-31',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  fullWidth: true,
  clearable: true,
  numberOfMonths: 2,
};

export const SingleMonth = Template.bind({});
SingleMonth.args = {
  label: 'Date Range',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  fullWidth: true,
  clearable: true,
  numberOfMonths: 1,
};

export const Required = Template.bind({});
Required.args = {
  label: 'Date Range (Required)',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  required: true,
  fullWidth: true,
  clearable: true,
  numberOfMonths: 2,
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Date Range',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  error: 'Please select a valid date range',
  fullWidth: true,
  clearable: true,
  numberOfMonths: 2,
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Date Range',
  fromDate: '2025-01-01',
  toDate: '2025-01-31',
  placeholderFrom: 'From Date',
  placeholderTo: 'To Date',
  disabled: true,
  fullWidth: true,
  clearable: true,
  numberOfMonths: 2,
};

