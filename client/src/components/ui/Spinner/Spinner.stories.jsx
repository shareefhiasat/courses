import React from 'react';
import Spinner from './Spinner';
import Button from '../Button';

export default {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
};

// Default
export const Default = {
  args: {},
};

// Sizes
export const AllSizes = () => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <Spinner size="small" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Small</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Spinner size="medium" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Medium</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Spinner size="large" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Large</p>
    </div>
  </div>
);

// Colors
export const AllColors = () => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <Spinner color="primary" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Primary</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Spinner color="secondary" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Secondary</p>
    </div>
    <div style={{ textAlign: 'center', background: '#333', padding: '1rem', borderRadius: '8px' }}>
      <Spinner color="white" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#fff' }}>White</p>
    </div>
  </div>
);

// Variants
export const AllVariants = () => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <Spinner variant="circle" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Circle</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Spinner variant="dots" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Dots</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Spinner variant="pulse" />
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Pulse</p>
    </div>
  </div>
);

// In Button
export const InButton = () => (
  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    <Button loading>Loading...</Button>
    <Button variant="secondary" loading>Processing...</Button>
    <Button variant="outline" loading>Saving...</Button>
  </div>
);

// Inline with Text
export const InlineWithText = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Spinner size="small" />
      <span>Loading data...</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Spinner size="small" variant="dots" />
      <span>Processing request...</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Spinner size="small" variant="pulse" />
      <span>Uploading file...</span>
    </div>
  </div>
);

// Centered in Container
export const CenteredInContainer = () => (
  <div style={{
    width: '100%',
    height: '300px',
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <Spinner size="large" />
    <p style={{ color: '#666' }}>Loading content...</p>
  </div>
);

// Full Screen Overlay
export const FullScreenOverlay = () => {
  const [loading, setLoading] = React.useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div>
      <Button onClick={handleClick}>
        Show Full Screen Loader (3s)
      </Button>
      {loading && <Spinner fullScreen label="Loading, please wait..." />}
    </div>
  );
};

// Loading States
export const LoadingStates = () => {
  const [states, setStates] = React.useState({
    data: false,
    form: false,
    upload: false,
  });

  const simulateLoad = (key) => {
    setStates({ ...states, [key]: true });
    setTimeout(() => {
      setStates({ ...states, [key]: false });
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <div style={{
        padding: '1rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {states.data ? (
          <div style={{ textAlign: 'center' }}>
            <Spinner />
            <p style={{ marginTop: '0.5rem', color: '#666' }}>Loading data...</p>
          </div>
        ) : (
          <Button onClick={() => simulateLoad('data')}>Load Data</Button>
        )}
      </div>

      <div style={{
        padding: '1rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
      }}>
        <Button
          onClick={() => simulateLoad('form')}
          loading={states.form}
          fullWidth
        >
          Submit Form
        </Button>
      </div>

      <div style={{
        padding: '1rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {states.upload && <Spinner size="small" variant="dots" />}
        <span style={{ flex: 1 }}>
          {states.upload ? 'Uploading...' : 'Ready to upload'}
        </span>
        <Button
          size="small"
          onClick={() => simulateLoad('upload')}
          disabled={states.upload}
        >
          Upload
        </Button>
      </div>
    </div>
  );
};
