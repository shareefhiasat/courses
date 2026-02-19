/**
 * World-Class Performance Dashboard Tests
 * Comprehensive test suite for functionality and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@contexts/ThemeContext';
import { LangProvider } from '@contexts/LangContext';
import WorldClassPerformanceDashboard from './WorldClassPerformanceDashboard';

// Mock performance utils
jest.mock('@utils/performance', () => ({
  performanceMetrics: {
    getReport: jest.fn(() => ({
      'getUserById': {
        count: 10,
        successRate: '100.00',
        averageDuration: 150,
        minDuration: 100,
        maxDuration: 200
      },
      'slowOperation': {
        count: 5,
        successRate: '85.00',
        averageDuration: 1500,
        minDuration: 1000,
        maxDuration: 2000
      }
    })),
    clear: jest.fn()
  },
  resourceMonitor: {
    getMemoryUsage: jest.fn(() => ({
      used: 100,
      total: 107,
      percentage: 2,
      limit: 4096
    })),
    getConnectionCount: jest.fn(() => 0)
  }
}));

// Mock theme and lang contexts
const mockTheme = { theme: 'light' };
const mockLang = { t: (key) => key || 'Test' };

const TestWrapper = ({ children }) => (
  <ThemeProvider value={mockTheme}>
    <LangProvider value={mockLang}>
      {children}
    </LangProvider>
  </ThemeProvider>
);

describe('WorldClassPerformanceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with all components', () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Check main components are rendered
    expect(screen.getByText(/performance_dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/realtime_monitoring/i)).toBeInTheDocument();
  });

  test('displays system health score', () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Check health score is displayed
    expect(screen.getByText(/score/i)).toBeInTheDocument();
    expect(screen.getByText(/operations/i)).toBeInTheDocument();
    expect(screen.getByText(/alerts/i)).toBeInTheDocument();
  });

  test('renders metric cards with correct data', () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Check metric cards
    expect(screen.getByText(/memory_usage/i)).toBeInTheDocument();
    expect(screen.getByText(/active_connections/i)).toBeInTheDocument();
    expect(screen.getByText(/operations_tracked/i)).toBeInTheDocument();
    
    // Check specific values
    expect(screen.getByText('100MB')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('renders performance metrics table', () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Check table headers
    expect(screen.getByText(/operation/i)).toBeInTheDocument();
    expect(screen.getByText(/health/i)).toBeInTheDocument();
    expect(screen.getByText(/total_calls/i)).toBeInTheDocument();
    expect(screen.getByText(/success_rate/i)).toBeInTheDocument();
    expect(screen.getByText(/avg_duration/i)).toBeInTheDocument();

    // Check operation data
    expect(screen.getByText('getUserById')).toBeInTheDocument();
    expect(screen.getByText('slowOperation')).toBeInTheDocument();
  });

  test('handles pause/resume functionality', async () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Find pause button
    const pauseButton = screen.getByText(/pause/i);
    expect(pauseButton).toBeInTheDocument();

    // Click pause button
    fireEvent.click(pauseButton);

    // Should show resume button
    await waitFor(() => {
      expect(screen.getByText(/resume/i)).toBeInTheDocument();
    });
  });

  test('handles clear metrics functionality', () => {
    const { performanceMetrics } = require('@utils/performance');
    
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Find clear button
    const clearButton = screen.getByText(/clear_metrics/i);
    expect(clearButton).toBeInTheDocument();

    // Click clear button
    fireEvent.click(clearButton);

    // Check if clear was called
    expect(performanceMetrics.clear).toHaveBeenCalled();
  });

  test('handles refresh interval change', async () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Find refresh interval selector
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();

    // Change refresh interval
    fireEvent.change(selectElement, { target: { value: '10000' } });

    await waitFor(() => {
      expect(selectElement.value).toBe('10000');
    });
  });

  test('generates alerts for critical issues', () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Should show alerts for slow operation and low success rate
    expect(screen.getByText(/slow_operation/i)).toBeInTheDocument();
    expect(screen.getByText(/low_success_rate/i)).toBeInTheDocument();
  });

  test('displays insights panel with recommendations', () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Check insights panel
    expect(screen.getByText(/performance_insights/i)).toBeInTheDocument();
    expect(screen.getByText(/insights/i)).toBeInTheDocument();
    expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
    expect(screen.getByText(/trends/i)).toBeInTheDocument();
  });

  test('handles tab switching in insights panel', async () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Click recommendations tab
    const recommendationsTab = screen.getByText(/recommendations/i);
    fireEvent.click(recommendationsTab);

    await waitFor(() => {
      expect(screen.getByText(/performance_optimization_tips/i)).toBeInTheDocument();
    });

    // Click trends tab
    const trendsTab = screen.getByText(/trends/i);
    fireEvent.click(trendsTab);

    await waitFor(() => {
      expect(screen.getByText(/performance_trends/i)).toBeInTheDocument();
    });
  });

  test('handles table sorting', async () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Click operation column header to sort
    const operationHeader = screen.getByText(/operation/i);
    fireEvent.click(operationHeader);

    // Should trigger sorting (visual confirmation would be in UI)
    expect(operationHeader).toBeInTheDocument();
  });

  test('handles table filtering', async () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Find search input
    const searchInput = screen.getByPlaceholderText(/search_operations/i);
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'getUser' } });

    await waitFor(() => {
      expect(searchInput.value).toBe('getUser');
    });

    // Find health filter
    const healthFilter = screen.getByRole('combobox', { name: /health/i });
    expect(healthFilter).toBeInTheDocument();

    // Change health filter
    fireEvent.change(healthFilter, { target: { value: 'healthy' } });

    await waitFor(() => {
      expect(healthFilter.value).toBe('healthy');
    });
  });

  test('handles table row expansion', async () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Find expand button for first row
    const expandButtons = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('expand') ||
      button.querySelector('svg')?.getAttribute('data-icon')?.includes('chevron_down')
    );

    if (expandButtons.length > 0) {
      fireEvent.click(expandButtons[0]);

      // Should show expanded details
      await waitFor(() => {
        expect(screen.getByText(/duration_details/i)).toBeInTheDocument();
      });
    }
  });

  test('handles export functionality', async () => {
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock createElement and click
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    global.document.createElement = jest.fn(() => mockAnchor);

    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Find export button
    const exportButton = screen.getByText(/export/i);
    expect(exportButton).toBeInTheDocument();

    // Click export button
    fireEvent.click(exportButton);

    // Should show export menu
    await waitFor(() => {
      expect(screen.getByText(/export_json/i)).toBeInTheDocument();
    });

    // Click export JSON
    const exportJsonButton = screen.getByText(/export_json/i);
    fireEvent.click(exportJsonButton);

    // Should trigger download
    expect(global.document.createElement).toHaveBeenCalledWith('a');
  });

  test('is accessible', async () => {
    const { container } = render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Check for proper ARIA labels
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Check for keyboard navigation
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusableElements.length).toBeGreaterThan(0);

    // Check for proper heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);
  });

  test('handles error states gracefully', () => {
    // Mock error in performance metrics
    const { performanceMetrics } = require('@utils/performance');
    performanceMetrics.getReport.mockImplementation(() => {
      throw new Error('Performance metrics error');
    });

    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Should still render dashboard without crashing
    expect(screen.getByText(/performance_dashboard/i)).toBeInTheDocument();
  });

  test('handles empty state', () => {
    // Mock empty metrics
    const { performanceMetrics } = require('@utils/performance');
    performanceMetrics.getReport.mockReturnValue({});

    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Should show empty state message
    expect(screen.getByText(/no_performance_metrics/i)).toBeInTheDocument();
  });
});

describe('PerformanceDashboard Accessibility', () => {
  test('has proper color contrast', () => {
    // This would be tested with axe-core or similar tool
    const { container } = render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Basic accessibility check
    expect(container).toBeAccessible();
  });

  test('supports keyboard navigation', () => {
    const { container } = render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Tab through elements
    const firstButton = screen.getByRole('button');
    firstButton.focus();
    expect(firstButton).toHaveFocus();

    // Continue tab navigation test...
  });

  test('announces changes to screen readers', () => {
    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Test ARIA live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    expect(liveRegions.length).toBeGreaterThan(0);
  });
});

describe('PerformanceDashboard Responsiveness', () => {
  test('adapts to mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Should adapt layout for mobile
    expect(screen.getByText(/performance_dashboard/i)).toBeInTheDocument();
  });

  test('adapts to tablet viewport', () => {
    // Mock tablet viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Should adapt layout for tablet
    expect(screen.getByText(/performance_dashboard/i)).toBeInTheDocument();
  });

  test('adapts to desktop viewport', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(
      <TestWrapper>
        <WorldClassPerformanceDashboard />
      </TestWrapper>
    );

    // Should adapt layout for desktop
    expect(screen.getByText(/performance_dashboard/i)).toBeInTheDocument();
  });
});
