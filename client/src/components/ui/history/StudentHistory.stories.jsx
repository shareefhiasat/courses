import React, { useState } from 'react';
import { StudentHistory } from './index';

export default {
  title: 'UI/History/StudentHistory',
  component: StudentHistory,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    groupedLogs: { control: 'object' },
    expandedDays: { control: 'object' },
    activeFilters: { control: 'object' },
    toggleDayExpansion: { action: 'toggleDayExpansion' },
    handleDeleteAttendance: { action: 'handleDeleteAttendance' },
    handleDeletePenalty: { action: 'handleDeletePenalty' },
    t: { control: 'text' },
    isRTL: { control: 'boolean' },
    studentId: { control: 'text' }
  }
};

const mockGroupedLogs = [
  {
    date: '2024-01-15',
    attendance: [
      {
        id: 'att1',
        label: 'Present',
        time: new Date('2024-01-15T09:00:00'),
        color: '#10b981',
        comment: 'On time',
        performedBy: { displayName: 'John Doe', email: 'john@example.com' }
      }
    ],
    participation: [
      {
        id: 'part1',
        label: 'Answered Question',
        time: new Date('2024-01-15T10:30:00'),
        points: 5,
        comment: 'Great answer',
        performedBy: { displayName: 'John Doe', email: 'john@example.com' }
      }
    ],
    behavior: [
      {
        id: 'beh1',
        label: 'Helpful',
        time: new Date('2024-01-15T11:00:00'),
        points: 3,
        comment: 'Helped classmate',
        performedBy: { displayName: 'John Doe', email: 'john@example.com' }
      }
    ],
    penalties: [
      {
        id: 'pen1',
        label: 'Late submission',
        time: new Date('2024-01-15T14:00:00'),
        severity: 'Minor',
        comment: 'Submitted 1 hour late',
        performedBy: { displayName: 'John Doe', email: 'john@example.com' }
      }
    ]
  },
  {
    date: '2024-01-14',
    attendance: [
      {
        id: 'att2',
        label: 'Absent',
        time: new Date('2024-01-14T09:00:00'),
        color: '#ef4444',
        comment: 'Sick',
        performedBy: { displayName: 'Jane Smith', email: 'jane@example.com' }
      }
    ],
    participation: [],
    behavior: [],
    penalties: []
  }
];

const Template = (args) => {
  const [expandedDays, setExpandedDays] = useState(new Set());
  
  const toggleDayExpansion = (date) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  return (
    <div style={{ width: '800px', maxHeight: '600px', overflow: 'auto' }}>
      <StudentHistory 
        {...args}
        expandedDays={expandedDays}
        toggleDayExpansion={toggleDayExpansion}
      />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  groupedLogs: mockGroupedLogs,
  activeFilters: {
    attendance: true,
    participation: true,
    behavior: true,
    penalties: true
  },
  t: (key) => key,
  isRTL: false,
  studentId: 'student123'
};

export const RTL = Template.bind({});
RTL.args = {
  ...Default.args,
  isRTL: true
};

export const PartialFilters = Template.bind({});
PartialFilters.args = {
  ...Default.args,
  activeFilters: {
    attendance: true,
    participation: false,
    behavior: true,
    penalties: false
  }
};
