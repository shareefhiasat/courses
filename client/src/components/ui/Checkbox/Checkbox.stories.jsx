import React, { useState } from 'react';
import Checkbox from './Checkbox';

export default {
  title: 'Form/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    label: {
      control: 'text',
      description: 'Label text',
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
    helperText: {
      control: 'text',
      description: 'Helper text below checkbox',
    },
  },
};

const Template = (args) => {
  const [checked, setChecked] = useState(args.checked || false);
  
  return (
    <div style={{ maxWidth: 400, padding: '2rem' }}>
      <Checkbox
        {...args}
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          console.log('Checkbox checked:', e.target.checked);
        }}
      />
      <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: 4, fontSize: '0.875rem' }}>
        <strong>Status:</strong> {checked ? 'Checked ✓' : 'Unchecked'}
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  label: 'Accept terms and conditions',
};

export const Checked = Template.bind({});
Checked.args = {
  label: 'Show to students',
  checked: true,
};

export const WithHelperText = Template.bind({});
WithHelperText.args = {
  label: 'Enable notifications',
  helperText: 'You will receive email notifications for important updates',
};

export const Required = Template.bind({});
Required.args = {
  label: 'I agree to the privacy policy',
  required: true,
  helperText: 'This field is required',
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Subscribe to newsletter',
  error: 'You must accept to continue',
  checked: false,
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled checkbox',
  disabled: true,
  checked: false,
};

export const DisabledChecked = Template.bind({});
DisabledChecked.args = {
  label: 'Disabled and checked',
  disabled: true,
  checked: true,
};

export const ActivityOptions = () => {
  const [options, setOptions] = useState({
    show: true,
    allowRetake: false,
    featured: false,
    optional: false,
    requiresSubmission: true,
  });

  const handleChange = (key) => (e) => {
    setOptions({ ...options, [key]: e.target.checked });
  };

  return (
    <div style={{ maxWidth: 500, padding: '2rem' }}>
      <h3 style={{ marginTop: 0 }}>Activity Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Checkbox
          label="Show to students"
          checked={options.show}
          onChange={handleChange('show')}
        />
        <Checkbox
          label="Allow retakes"
          checked={options.allowRetake}
          onChange={handleChange('allowRetake')}
          helperText="Students can retake this activity"
        />
        <Checkbox
          label="Featured"
          checked={options.featured}
          onChange={handleChange('featured')}
          helperText="Display prominently on homepage"
        />
        <Checkbox
          label="Optional (if off: Required)"
          checked={options.optional}
          onChange={handleChange('optional')}
        />
        <Checkbox
          label="📤 Requires Submission"
          checked={options.requiresSubmission}
          onChange={handleChange('requiresSubmission')}
        />
      </div>
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0f0f0', borderRadius: 8 }}>
        <strong>Selected Options:</strong>
        <pre style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          {JSON.stringify(options, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const EmailNotifications = () => {
  const [notifications, setNotifications] = useState({
    onGrade: true,
    onComment: true,
    onAnnouncement: false,
    onDeadline: true,
  });

  const handleChange = (key) => (e) => {
    setNotifications({ ...notifications, [key]: e.target.checked });
  };

  return (
    <div style={{ maxWidth: 500, padding: '2rem' }}>
      <h3 style={{ marginTop: 0 }}>Email Notifications</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Checkbox
          label="📧 Notify on grade"
          checked={notifications.onGrade}
          onChange={handleChange('onGrade')}
        />
        <Checkbox
          label="💬 Notify on comment"
          checked={notifications.onComment}
          onChange={handleChange('onComment')}
        />
        <Checkbox
          label="📢 Notify on announcement"
          checked={notifications.onAnnouncement}
          onChange={handleChange('onAnnouncement')}
        />
        <Checkbox
          label="⏰ Notify on deadline"
          checked={notifications.onDeadline}
          onChange={handleChange('onDeadline')}
        />
      </div>
    </div>
  );
};

export const DarkMode = Template.bind({});
DarkMode.args = {
  label: 'Dark mode checkbox',
  helperText: 'This checkbox adapts to dark theme',
};
DarkMode.decorators = [
  (Story) => (
    <div style={{ background: '#1a1a1a', padding: '2rem', minHeight: '400px' }}>
      <Story />
    </div>
  ),
];
