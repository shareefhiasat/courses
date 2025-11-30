import React, { useState } from 'react';
import UrlInput from './UrlInput';

export default {
  title: 'Form/UrlInput',
  component: UrlInput,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'URL value',
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
  },
};

const Template = (args) => {
  const [value, setValue] = useState(args.value || '');
  const [message, setMessage] = useState('');
  
  return (
    <div style={{ maxWidth: 600, padding: '2rem' }}>
      <UrlInput
        {...args}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          console.log('URL value:', e.target.value);
        }}
        onOpen={(url) => {
          setMessage(`Opening: ${url}`);
          console.log('Open URL:', url);
          setTimeout(() => setMessage(''), 2000);
        }}
        onCopy={() => {
          setMessage('✓ Copied to clipboard!');
          console.log('URL copied');
          setTimeout(() => setMessage(''), 2000);
        }}
        onClear={() => {
          setValue('');
          setMessage('URL cleared');
          console.log('URL cleared');
          setTimeout(() => setMessage(''), 2000);
        }}
      />
      {message && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#d4edda', color: '#155724', borderRadius: 4, fontSize: '0.875rem' }}>
          {message}
        </div>
      )}
      <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#f0f0f0', borderRadius: 4, fontSize: '0.875rem' }}>
        <strong>Current URL:</strong> {value || 'None'}
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  label: 'Website URL',
  placeholder: 'https://example.com',
};

export const ActivityURL = Template.bind({});
ActivityURL.args = {
  label: 'Activity URL',
  placeholder: 'Activity URL',
  value: 'https://github.com/username/repo',
  helperText: 'Link to the activity resource',
};

export const ImageURL = Template.bind({});
ImageURL.args = {
  label: 'Image URL',
  placeholder: 'Image URL',
  value: 'https://images.unsplash.com/photo-1234567890',
  helperText: 'Direct link to image file',
};

export const ResourceURL = Template.bind({});
ResourceURL.args = {
  label: 'Resource URL',
  placeholder: 'https://...',
  value: 'https://docs.google.com/document/d/abc123',
  required: true,
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Invalid URL',
  placeholder: 'Enter valid URL',
  value: 'not-a-valid-url',
  error: 'Please enter a valid URL starting with http:// or https://',
};

export const Required = Template.bind({});
Required.args = {
  label: 'Project URL',
  placeholder: 'https://...',
  required: true,
  helperText: 'This field is required',
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled URL Input',
  placeholder: 'Cannot edit',
  disabled: true,
  value: 'https://example.com/locked',
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  label: 'Full Width URL Input',
  placeholder: 'Spans full container width',
  fullWidth: true,
  value: 'https://very-long-url-example.com/path/to/resource',
};

export const WithQuickActions = () => {
  const [url, setUrl] = useState('https://github.com/facebook/react');
  const [logs, setLogs] = useState([]);

  const addLog = (action) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs([`[${timestamp}] ${action}`, ...logs].slice(0, 5));
  };

  return (
    <div style={{ maxWidth: 600, padding: '2rem' }}>
      <h3 style={{ marginTop: 0 }}>URL Input with Quick Actions</h3>
      <UrlInput
        label="Repository URL"
        placeholder="https://github.com/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onOpen={(href) => {
          addLog(`Opened: ${href}`);
          window.open(href, '_blank');
        }}
        onCopy={() => {
          addLog('Copied to clipboard');
          navigator.clipboard.writeText(url);
        }}
        onClear={() => {
          addLog('URL cleared');
          setUrl('');
        }}
        fullWidth
      />
      <div style={{ marginTop: '1.5rem' }}>
        <strong>Action Log:</strong>
        <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'monospace' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#999' }}>No actions yet. Try the quick action buttons!</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.25rem' }}>{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const DarkMode = Template.bind({});
DarkMode.args = {
  label: 'Dark Mode URL Input',
  placeholder: 'https://...',
  value: 'https://example.com/dark-theme',
  helperText: 'URL input in dark mode',
};
DarkMode.decorators = [
  (Story) => (
    <div style={{ background: '#1a1a1a', padding: '2rem', minHeight: '400px' }}>
      <Story />
    </div>
  ),
];
