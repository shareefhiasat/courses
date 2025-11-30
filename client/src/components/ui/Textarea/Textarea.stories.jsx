import React, { useState } from 'react';
import Textarea from './Textarea';

export default {
  title: 'Form/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Textarea value',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    rows: {
      control: { type: 'number', min: 2, max: 20 },
      description: 'Number of rows',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character count',
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
      description: 'Helper text below textarea',
    },
  },
};

const Template = (args) => {
  const [value, setValue] = useState(args.value || '');
  
  return (
    <div style={{ maxWidth: 600, padding: '2rem' }}>
      <Textarea
        {...args}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          console.log('Textarea value:', e.target.value);
        }}
      />
      <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: 4, fontSize: '0.875rem' }}>
        <strong>Character Count:</strong> {value.length}
        {args.maxLength && ` / ${args.maxLength}`}
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  label: 'Description',
  placeholder: 'Enter your description here...',
  rows: 4,
};

export const WithHelperText = Template.bind({});
WithHelperText.args = {
  label: 'Feedback',
  placeholder: 'Share your thoughts...',
  rows: 5,
  helperText: 'Your feedback helps us improve',
};

export const WithCharacterLimit = Template.bind({});
WithCharacterLimit.args = {
  label: 'Bio',
  placeholder: 'Write a short bio...',
  rows: 4,
  maxLength: 200,
  helperText: 'Maximum 200 characters',
};

export const Required = Template.bind({});
Required.args = {
  label: 'Comments',
  placeholder: 'This field is required',
  rows: 3,
  required: true,
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Message',
  placeholder: 'Enter your message',
  rows: 4,
  error: 'Message must be at least 10 characters',
  value: 'Short',
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Textarea',
  placeholder: 'Cannot edit',
  rows: 4,
  disabled: true,
  value: 'This content cannot be edited',
};

export const LargeTextarea = Template.bind({});
LargeTextarea.args = {
  label: 'Article Content',
  placeholder: 'Write your article here...',
  rows: 12,
  maxLength: 5000,
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  label: 'Full Width Textarea',
  placeholder: 'Spans full container width',
  rows: 6,
  fullWidth: true,
};

export const EmailTemplate = Template.bind({});
EmailTemplate.args = {
  label: 'Email Body (HTML)',
  placeholder: 'Paste your HTML here... You can use variables: %DISPLAY_NAME%, %EMAIL%, %APP_NAME%',
  rows: 12,
  helperText: '💡 Available variables: %DISPLAY_NAME%, %EMAIL%, %APP_NAME%',
  value: '<h1>Hello %DISPLAY_NAME%!</h1>\n<p>Welcome to our platform.</p>',
};

export const DarkMode = Template.bind({});
DarkMode.args = {
  label: 'Dark Mode Textarea',
  placeholder: 'Enter text in dark mode...',
  rows: 6,
  helperText: 'This textarea adapts to dark theme',
};
DarkMode.decorators = [
  (Story) => (
    <div style={{ background: '#1a1a1a', padding: '2rem', minHeight: '400px' }}>
      <Story />
    </div>
  ),
];

export const CodeEditor = Template.bind({});
CodeEditor.args = {
  label: 'Code Snippet',
  placeholder: 'Enter your code here...',
  rows: 10,
  value: 'function hello() {\n  console.log("Hello World!");\n}',
  helperText: 'Use monospace font for code',
};
