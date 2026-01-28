import React from 'react';
import DragGrid from './DragGrid';

export default {
  title: 'Shared/Common/DragGrid',
  component: DragGrid,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    storageKey: {
      control: 'text',
      defaultValue: 'drag_grid_layout',
    },
  },
};

const mockWidgets = [
  {
    id: 'widget1',
    title: 'User Statistics',
    render: () => (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3>User Statistics</h3>
        <p>Total Users: 1,234</p>
        <p>Active Users: 892</p>
        <p>New Users Today: 12</p>
      </div>
    ),
  },
  {
    id: 'widget2',
    title: 'Recent Activity',
    render: () => (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fef3c7', 
        borderRadius: '8px',
        border: '1px solid #f59e0b'
      }}>
        <h3>Recent Activity</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>• User logged in</li>
          <li>• New order placed</li>
          <li>• Report generated</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'widget3',
    title: 'Quick Actions',
    render: () => (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#dcfce7', 
        borderRadius: '8px',
        border: '1px solid #22c55e'
      }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #22c55e' }}>
            Add User
          </button>
          <button style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #22c55e' }}>
            Generate Report
          </button>
        </div>
      </div>
    ),
  },
  {
    id: 'widget4',
    title: 'System Status',
    render: () => (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fee2e2', 
        borderRadius: '8px',
        border: '1px solid #ef4444'
      }}>
        <h3>System Status</h3>
        <p>🟢 Database: Online</p>
        <p>🟢 API: Healthy</p>
        <p>🟡 Cache: Warning</p>
      </div>
    ),
  },
];

export const Default = {
  args: {
    widgets: mockWidgets,
    storageKey: 'drag_grid_demo',
  },
};

export const FewerWidgets = {
  args: {
    widgets: mockWidgets.slice(0, 2),
    storageKey: 'drag_grid_few',
  },
};

export const ManyWidgets = {
  args: {
    widgets: [
      ...mockWidgets,
      {
        id: 'widget5',
        title: 'Analytics',
        render: () => (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#e0e7ff', 
            borderRadius: '8px',
            border: '1px solid #6366f1'
          }}>
            <h3>Analytics</h3>
            <p>Page Views: 45,678</p>
            <p>Bounce Rate: 23%</p>
            <p>Avg Session: 4:32</p>
          </div>
        ),
      },
      {
        id: 'widget6',
        title: 'Notifications',
        render: () => (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f3e8ff', 
            borderRadius: '8px',
            border: '1px solid #9333ea'
          }}>
            <h3>Notifications</h3>
            <p>📧 3 new emails</p>
            <p>🔔 5 system alerts</p>
            <p>💬 2 messages</p>
          </div>
        ),
      },
    ],
    storageKey: 'drag_grid_many',
  },
};

export const CustomStyling = {
  render: () => {
    const customWidgets = mockWidgets.map(widget => ({
      ...widget,
      render: () => (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#1f2937', 
          color: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #374151',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {widget.render()}
        </div>
      ),
    }));

    return (
      <div style={{ backgroundColor: '#111827', minHeight: '100vh', padding: '20px' }}>
        <h2 style={{ color: '#f9fafb', marginBottom: '20px' }}>Dark Theme DragGrid</h2>
        <DragGrid widgets={customWidgets} storageKey="drag_grid_dark" />
      </div>
    );
  },
};

export const PersistentLayout = {
  render: () => {
    const [key, setKey] = React.useState(0);
    
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setKey(prev => prev + 1)} style={{ padding: '10px 20px', marginRight: '10px' }}>
            Reset Layout
          </button>
          <small style={{ color: '#6b7280' }}>
            Drag widgets to reorder, then refresh the page to see persistence
          </small>
        </div>
        <DragGrid key={key} widgets={mockWidgets} storageKey="drag_grid_persistent" />
      </div>
    );
  },
};
