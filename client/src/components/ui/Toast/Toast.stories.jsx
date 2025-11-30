import React from 'react';
import { ToastProvider, useToast } from './Toast';
import Button from '../Button';

export default {
  title: 'UI/Toast',
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

// Demo Component
const ToastDemo = () => {
  const toast = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <h3>Click buttons to show toasts</h3>
      
      <Button
        variant="primary"
        onClick={() => toast.success('Operation completed successfully!')}
      >
        Show Success Toast
      </Button>
      
      <Button
        variant="danger"
        onClick={() => toast.error('An error occurred. Please try again.')}
      >
        Show Error Toast
      </Button>
      
      <Button
        variant="secondary"
        onClick={() => toast.warning('This action cannot be undone.')}
      >
        Show Warning Toast
      </Button>
      
      <Button
        variant="outline"
        onClick={() => toast.info('You have 3 new notifications.')}
      >
        Show Info Toast
      </Button>
    </div>
  );
};

export const AllTypes = () => <ToastDemo />;

// Custom Duration
const CustomDurationDemo = () => {
  const toast = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <h3>Custom Duration</h3>
      
      <Button onClick={() => toast.success('Quick message (2s)', 2000)}>
        2 Second Toast
      </Button>
      
      <Button onClick={() => toast.info('Normal message (5s)', 5000)}>
        5 Second Toast
      </Button>
      
      <Button onClick={() => toast.warning('Long message (10s)', 10000)}>
        10 Second Toast
      </Button>
      
      <Button onClick={() => toast.error('Persistent message', 0)}>
        No Auto-Close (Click X to close)
      </Button>
    </div>
  );
};

export const CustomDuration = () => <CustomDurationDemo />;

// Multiple Toasts
const MultipleToastsDemo = () => {
  const toast = useToast();

  const showMultiple = () => {
    toast.success('First notification');
    setTimeout(() => toast.info('Second notification'), 500);
    setTimeout(() => toast.warning('Third notification'), 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <h3>Multiple Toasts</h3>
      <p style={{ color: '#666', fontSize: '0.875rem' }}>
        Toasts stack vertically in the top-right corner
      </p>
      
      <Button variant="primary" onClick={showMultiple}>
        Show 3 Toasts
      </Button>
    </div>
  );
};

export const MultipleToasts = () => <MultipleToastsDemo />;

// Real-world Examples
const RealWorldExamplesDemo = () => {
  const toast = useToast();

  const handleSave = () => {
    // Simulate save operation
    setTimeout(() => {
      toast.success('Changes saved successfully!');
    }, 500);
  };

  const handleDelete = () => {
    toast.warning('Are you sure? This cannot be undone.');
    setTimeout(() => {
      toast.success('Item deleted');
    }, 2000);
  };

  const handleUpload = () => {
    toast.info('Uploading file...');
    setTimeout(() => {
      toast.success('File uploaded successfully!');
    }, 3000);
  };

  const handleError = () => {
    toast.error('Failed to connect to server. Please check your internet connection.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <h3>Real-world Examples</h3>
      
      <Button variant="primary" onClick={handleSave}>
        Save Changes
      </Button>
      
      <Button variant="danger" onClick={handleDelete}>
        Delete Item
      </Button>
      
      <Button variant="secondary" onClick={handleUpload}>
        Upload File
      </Button>
      
      <Button variant="outline" onClick={handleError}>
        Trigger Error
      </Button>
    </div>
  );
};

export const RealWorldExamples = () => <RealWorldExamplesDemo />;

// Form Submission Example
const FormExample = () => {
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Form submitted successfully!');
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3>Form Submission</h3>
      <input
        type="text"
        placeholder="Enter your name"
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          fontSize: '1rem',
        }}
      />
      <Button type="submit" loading={loading} fullWidth>
        Submit Form
      </Button>
    </form>
  );
};

export const FormSubmission = () => <FormExample />;
