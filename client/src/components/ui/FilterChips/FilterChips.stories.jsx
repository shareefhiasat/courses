import React from 'react';
import FilterChips from './FilterChips';

export default {
  title: 'Shared/UI/FilterChips',
  component: FilterChips,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['type', 'level', 'status', 'custom'],
      defaultValue: 'type',
    },
    filters: {
      control: 'object',
      description: 'Array of filter configs',
    },
  },
};

const mockFilters = [
  { id: 'all', label: 'All', icon: 'Star', bg: '#f3f4f6', fg: '#6b7280', active: true },
  { id: 'participation', label: 'Participation', icon: 'Award', bg: '#dcfce7', fg: '#16a34a', active: false },
  { id: 'behavior', label: 'Behavior', icon: 'AlertTriangle', bg: '#fee2e2', fg: '#dc2626', active: false },
  { id: 'absence', label: 'Absence', icon: 'Clock', bg: '#fef3c7', fg: '#d97706', active: false },
];

export const Default = {
  args: {
    variant: 'type',
    filters: mockFilters,
    t: (key) => key, // Mock translation function
  },
};

export const LevelFilters = {
  args: {
    variant: 'level',
    filters: [
      { id: 'all', label: 'All Levels', icon: 'Star', bg: '#f3f4f6', fg: '#6b7280', active: true },
      { id: 'beginner', label: 'Beginner', icon: 'StarOff', bg: '#dbeafe', fg: '#2563eb', active: false },
      { id: 'intermediate', label: 'Intermediate', icon: 'Star', bg: '#fef3c7', fg: '#d97706', active: false },
      { id: 'advanced', label: 'Advanced', icon: 'Award', bg: '#dcfce7', fg: '#16a34a', active: false },
    ],
    t: (key) => key,
  },
};

export const StatusFilters = {
  args: {
    variant: 'status',
    filters: [
      { id: 'active', label: 'Active', icon: 'CheckCircle', bg: '#dcfce7', fg: '#16a34a', active: true },
      { id: 'pending', label: 'Pending', icon: 'Hourglass', bg: '#fef3c7', fg: '#d97706', active: false },
      { id: 'inactive', label: 'Inactive', icon: 'XCircle', bg: '#fee2e2', fg: '#dc2626', active: false },
    ],
    t: (key) => key,
  },
};

export const CustomFilters = {
  args: {
    variant: 'custom',
    filters: [
      { id: 'recent', label: 'Recent', icon: 'Clock', bg: '#e0e7ff', fg: '#4f46e5', active: false },
      { id: 'popular', label: 'Popular', icon: 'Star', bg: '#fef3c7', fg: '#d97706', active: true },
      { id: 'archived', label: 'Archived', icon: 'Archive', bg: '#f3f4f6', fg: '#6b7280', active: false },
    ],
    t: (key) => key,
  },
};

const InteractiveDemo = () => {
  const [filters, setFilters] = React.useState(mockFilters);
  const handleFilterClick = (filterId) => {
    setFilters(prev => prev.map(filter => ({
      ...filter,
      active: filter.id === filterId ? !filter.active : filter.active
    })));
  };
  return (
    <div style={{ padding: '20px' }}>
      <FilterChips
        variant="type"
        filters={filters}
        t={(key) => key}
        onFilterClick={handleFilterClick}
      />
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
        Click on filters to toggle their state
      </div>
    </div>
  );
};

export const Interactive = {
  render: () => <InteractiveDemo />,
};
