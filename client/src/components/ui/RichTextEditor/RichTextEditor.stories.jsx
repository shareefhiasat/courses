import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

export default {
  title: 'Form/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Optional label displayed above the editor',
    },
    helperText: {
      control: 'text',
      description: 'Helper message shown below the editor',
    },
    error: {
      control: 'text',
      description: 'Error message shown below the editor',
    },
    height: {
      control: 'number',
      description: 'Minimum editor height in pixels',
    },
    readOnly: {
      control: 'boolean',
      description: 'Set the editor to read only mode',
    },
  },
};

const Template = (args) => {
  const [value, setValue] = useState(args.value || '<p>Explain the correct answer in detail.</p>');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <RichTextEditor
        {...args}
        value={value}
        onChange={setValue}
      />
      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Live HTML Output</h4>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem' }}>
{value}
        </pre>
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  label: 'Explanation',
  helperText: 'Students will see this after answering the question',
};

export const ErrorState = Template.bind({});
ErrorState.args = {
  label: 'Explanation',
  error: 'Explanation is required',
  value: '',
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  label: 'Published Explanation',
  readOnly: true,
  value: '<p><strong>Newton\'s Second Law</strong> states that <em>Force = Mass × Acceleration</em>.</p>',
};
