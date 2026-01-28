import React, { useState } from 'react';
import SmartGrid from './SmartGrid';

export default {
  title: 'Shared/Common/SmartGrid',
  component: SmartGrid,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      control: 'text',
      defaultValue: 'Data Grid',
    },
    searchPlaceholder: {
      control: 'text',
      defaultValue: 'Search...',
    },
    pageSize: {
      control: { type: 'range', min: 5, max: 50, step: 5 },
      defaultValue: 10,
    },
    showSearch: {
      control: 'boolean',
      defaultValue: true,
    },
    showPagination: {
      control: 'boolean',
      defaultValue: true,
    },
  },
};

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive', role: 'User' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Active', role: 'Editor' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'Pending', role: 'User' },
  { id: 6, name: 'Diana Davis', email: 'diana@example.com', status: 'Active', role: 'Admin' },
  { id: 7, name: 'Edward Miller', email: 'edward@example.com', status: 'Active', role: 'User' },
  { id: 8, name: 'Fiona Garcia', email: 'fiona@example.com', status: 'Inactive', role: 'Editor' },
];

const mockColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
];

export const Default = {
  args: {
    data: mockData,
    columns: mockColumns,
    title: 'User Management',
    searchPlaceholder: 'Search users...',
    pageSize: 5,
  },
};

export const WithoutSearch = {
  args: {
    data: mockData,
    columns: mockColumns,
    title: 'Simple Data Grid',
    showSearch: false,
    pageSize: 10,
  },
};

export const LargeDataset = {
  args: {
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: ['Active', 'Inactive', 'Pending'][i % 3],
      role: ['Admin', 'User', 'Editor'][i % 3],
    })),
    columns: mockColumns,
    title: 'Large Dataset (100 items)',
    pageSize: 20,
  },
};

export const WithActions = {
  args: {
    data: mockData,
    columns: mockColumns,
    title: 'Users with Actions',
    onEdit: (item) => alert(`Edit user: ${item.name}`),
    onDelete: (item) => alert(`Delete user: ${item.name}`),
    onAdd: () => alert('Add new user'),
    pageSize: 5,
  },
};

export const CustomStyling = {
  args: {
    data: mockData,
    columns: mockColumns,
    title: 'Custom Styled Grid',
    className: 'custom-grid',
    pageSize: 8,
  },
};
