import React from 'react';
import { Button } from '../Button';
import { useLoadingProgress } from '../../../hooks/useLoadingProgress';

/**
 * Demo component showing how to use the loading progress bar
 * This can be used in development or as a reference for other components
 */
const LoadingProgressDemo = () => {
  const { startLoading, updateProgress, endLoading, simulateLoading } = useLoadingProgress();

  const handleSimulateLoading = async () => {
    await simulateLoading(3000);
  };

  const handleManualLoading = () => {
    startLoading();
    
    // Manual progress updates
    setTimeout(() => updateProgress(20), 500);
    setTimeout(() => updateProgress(40), 1000);
    setTimeout(() => updateProgress(60), 1500);
    setTimeout(() => updateProgress(80), 2000);
    setTimeout(() => updateProgress(100), 2500);
    setTimeout(() => endLoading(), 2600);
  };

  const handleQuickLoading = () => {
    startLoading();
    setTimeout(() => endLoading(), 1000);
  };

  return (
    <div style={{ padding: '2rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>Loading Progress Demo</h3>
      <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Test the global loading progress bar that appears at the top of the screen.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={handleSimulateLoading}>
          Simulate Loading (3s)
        </Button>
        
        <Button onClick={handleManualLoading}>
          Manual Loading Steps
        </Button>
        
        <Button onClick={handleQuickLoading}>
          Quick Loading (1s)
        </Button>
      </div>
      
      <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background-secondary, #f8fafc)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
        <strong>Usage Examples:</strong>
        <pre style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'var(--background-tertiary, #f1f5f9)', borderRadius: '4px', fontSize: '0.75rem', overflow: 'auto' }}>
{`import { useLoadingProgress } from '@/hooks/useLoadingProgress';

const MyComponent = () => {
  const { startLoading, updateProgress, endLoading } = useLoadingProgress();
  
  const handleAsyncOperation = async () => {
    startLoading();
    try {
      // Your async operation here
      await fetchData();
      updateProgress(100);
    } catch (error) {
      // Handle error
    } finally {
      endLoading();
    }
  };
  
  return <Button onClick={handleAsyncOperation}>Load Data</Button>;
};`}
        </pre>
      </div>
    </div>
  );
};

export default LoadingProgressDemo;
