import React, { useState } from 'react';
import AdvancedDataGrid from './AdvancedDataGrid';
import { Badge } from '../';

export default {
  title: 'Data Display/AdvancedDataGrid',
  component: AdvancedDataGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

// Sample data
const sampleUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', age: 32, joinDate: '2023-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Student', status: 'active', age: 24, joinDate: '2023-02-20' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Instructor', status: 'inactive', age: 45, joinDate: '2022-11-10' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Student', status: 'active', age: 22, joinDate: '2023-03-05' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Student', status: 'active', age: 26, joinDate: '2023-01-28' },
  { id: 6, name: 'Diana Prince', email: 'diana@example.com', role: 'Instructor', status: 'active', age: 38, joinDate: '2022-09-15' },
  { id: 7, name: 'Eve Davis', email: 'eve@example.com', role: 'Student', status: 'inactive', age: 29, joinDate: '2023-04-12' },
  { id: 8, name: 'Frank Miller', email: 'frank@example.com', role: 'Admin', status: 'active', age: 41, joinDate: '2022-08-20' },
];

const sampleActivities = [
  { id: 1, title: 'Python Basics', type: 'Assignment', dueDate: '2024-12-01', maxScore: 100, submissions: 45, status: 'active' },
  { id: 2, title: 'React Quiz', type: 'Quiz', dueDate: '2024-11-25', maxScore: 50, submissions: 38, status: 'active' },
  { id: 3, title: 'Database Project', type: 'Project', dueDate: '2024-12-15', maxScore: 200, submissions: 12, status: 'active' },
  { id: 4, title: 'HTML/CSS Exercise', type: 'Exercise', dueDate: '2024-11-20', maxScore: 75, submissions: 52, status: 'completed' },
  { id: 5, title: 'JavaScript Functions', type: 'Assignment', dueDate: '2024-12-05', maxScore: 100, submissions: 28, status: 'active' },
];

const sampleEmailLogs = [
  { id: 1, type: 'newsletter', subject: 'Weekly Update', to: 'all@example.com', status: 'sent', timestamp: '2024-11-18T10:30:00' },
  { id: 2, type: 'announcement', subject: 'System Maintenance', to: 'admin@example.com', status: 'sent', timestamp: '2024-11-18T09:15:00' },
  { id: 3, type: 'activity', subject: 'New Assignment Posted', to: 'students@example.com', status: 'failed', timestamp: '2024-11-18T08:00:00' },
  { id: 4, type: 'enrollment', subject: 'Welcome to Course', to: 'newuser@example.com', status: 'sent', timestamp: '2024-11-17T14:20:00' },
];

export const BasicGrid = () => {
  return (
    <div style={{ height: 500, width: '100%', padding: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>User Management</h2>
      <AdvancedDataGrid
        rows={sampleUsers}
        columns={[
          { field: 'id', headerName: 'ID', width: 70 },
          { field: 'name', headerName: 'Name', width: 150 },
          { field: 'email', headerName: 'Email', width: 200 },
          { field: 'role', headerName: 'Role', width: 120 },
          { field: 'status', headerName: 'Status', width: 100 },
          { field: 'age', headerName: 'Age', width: 80 },
          { field: 'joinDate', headerName: 'Join Date', width: 120 },
        ]}
        pageSize={5}
        pageSizeOptions={[5, 10, 20]}
        showExportButton
      />
    </div>
  );
};

export const WithCustomCells = () => {
  return (
    <div style={{ height: 500, width: '100%', padding: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>Users with Custom Rendering</h2>
      <AdvancedDataGrid
        rows={sampleUsers}
        columns={[
          { field: 'id', headerName: 'ID', width: 70 },
          { field: 'name', headerName: 'Name', width: 150, flex: 1 },
          { field: 'email', headerName: 'Email', width: 200, flex: 1 },
          { 
            field: 'role', 
            headerName: 'Role', 
            width: 120,
            renderCell: (params) => {
              const colors = {
                Admin: 'danger',
                Instructor: 'warning',
                Student: 'primary',
              };
              return <Badge color={colors[params.value] || 'default'}>{params.value}</Badge>;
            }
          },
          { 
            field: 'status', 
            headerName: 'Status', 
            width: 100,
            renderCell: (params) => (
              <Badge color={params.value === 'active' ? 'success' : 'default'}>
                {params.value}
              </Badge>
            )
          },
          { field: 'age', headerName: 'Age', width: 80 },
        ]}
        pageSize={10}
        checkboxSelection
      />
    </div>
  );
};

export const ActivitiesGrid = () => {
  return (
    <div style={{ height: 500, width: '100%', padding: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>Activities Dashboard</h2>
      <AdvancedDataGrid
        rows={sampleActivities}
        columns={[
          { field: 'id', headerName: 'ID', width: 70 },
          { field: 'title', headerName: 'Title', width: 200, flex: 1 },
          { 
            field: 'type', 
            headerName: 'Type', 
            width: 120,
            renderCell: (params) => {
              const colors = {
                Assignment: 'primary',
                Quiz: 'warning',
                Project: 'danger',
                Exercise: 'success',
              };
              return <Badge color={colors[params.value]}>{params.value}</Badge>;
            }
          },
          { field: 'dueDate', headerName: 'Due Date', width: 120 },
          { field: 'maxScore', headerName: 'Max Score', width: 100 },
          { field: 'submissions', headerName: 'Submissions', width: 120 },
          { 
            field: 'status', 
            headerName: 'Status', 
            width: 120,
            renderCell: (params) => (
              <Badge color={params.value === 'active' ? 'success' : 'default'}>
                {params.value}
              </Badge>
            )
          },
        ]}
        pageSize={10}
        checkboxSelection
        exportFileName="activities"
        showExportButton
      />
    </div>
  );
};

export const EmailLogsGrid = () => {
  return (
    <div style={{ height: 500, width: '100%', padding: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>Email Logs</h2>
      <AdvancedDataGrid
        rows={sampleEmailLogs}
        columns={[
          { field: 'id', headerName: 'ID', width: 70 },
          { 
            field: 'type', 
            headerName: 'Type', 
            width: 150,
            renderCell: (params) => {
              const icons = {
                newsletter: '📬',
                announcement: '📢',
                activity: '📝',
                enrollment: '🎓',
              };
              return <span>{icons[params.value]} {params.value}</span>;
            }
          },
          { field: 'subject', headerName: 'Subject', width: 250, flex: 1 },
          { field: 'to', headerName: 'To', width: 200 },
          { 
            field: 'status', 
            headerName: 'Status', 
            width: 100,
            renderCell: (params) => (
              <Badge color={params.value === 'sent' ? 'success' : 'danger'}>
                {params.value === 'sent' ? '✓ Sent' : '✗ Failed'}
              </Badge>
            )
          },
          { 
            field: 'timestamp', 
            headerName: 'Date/Time', 
            width: 180,
            valueGetter: (params) => new Date(params.row.timestamp).toLocaleString('en-GB')
          },
        ]}
        pageSize={10}
        checkboxSelection
        exportFileName="email-logs"
        showExportButton
      />
    </div>
  );
};

export const WithActions = () => {
  const [rows, setRows] = useState(sampleUsers);

  const handleDelete = (id) => {
    if (window.confirm('Delete this user?')) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  return (
    <div style={{ height: 500, width: '100%', padding: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>Grid with Actions</h2>
      <AdvancedDataGrid
        rows={rows}
        columns={[
          { field: 'id', headerName: 'ID', width: 70 },
          { field: 'name', headerName: 'Name', width: 150, flex: 1 },
          { field: 'email', headerName: 'Email', width: 200, flex: 1 },
          { field: 'role', headerName: 'Role', width: 120 },
          { 
            field: 'actions', 
            headerName: 'Actions', 
            width: 150,
            sortable: false,
            renderCell: (params) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => alert(`Edit user ${params.row.name}`)}
                  style={{ padding: '4px 8px', background: '#800020', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(params.row.id)}
                  style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            )
          },
        ]}
        pageSize={10}
      />
    </div>
  );
};

export const LargeDataset = () => {
  // Generate 100 rows
  const largeDataset = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['Admin', 'Instructor', 'Student'][i % 3],
    status: i % 5 === 0 ? 'inactive' : 'active',
    age: 20 + (i % 40),
    joinDate: `2023-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  }));

  return (
    <div style={{ height: 600, width: '100%', padding: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>Large Dataset (100 rows)</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Test pagination, sorting, filtering, and export with a larger dataset
      </p>
      <AdvancedDataGrid
        rows={largeDataset}
        columns={[
          { field: 'id', headerName: 'ID', width: 70 },
          { field: 'name', headerName: 'Name', width: 150 },
          { field: 'email', headerName: 'Email', width: 200, flex: 1 },
          { field: 'role', headerName: 'Role', width: 120 },
          { field: 'status', headerName: 'Status', width: 100 },
          { field: 'age', headerName: 'Age', width: 80 },
          { field: 'joinDate', headerName: 'Join Date', width: 120 },
        ]}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        checkboxSelection
        exportFileName="large-dataset"
        showExportButton
      />
    </div>
  );
};

export const DarkMode = () => {
  return (
    <div style={{ background: '#1a1a1a', minHeight: '100vh', padding: '2rem' }}>
      <h2 style={{ marginTop: 0, color: 'white' }}>Dark Mode Grid</h2>
      <div style={{ height: 500, width: '100%' }}>
        <AdvancedDataGrid
          rows={sampleUsers}
          columns={[
            { field: 'id', headerName: 'ID', width: 70 },
            { field: 'name', headerName: 'Name', width: 150, flex: 1 },
            { field: 'email', headerName: 'Email', width: 200, flex: 1 },
            { field: 'role', headerName: 'Role', width: 120 },
            { field: 'status', headerName: 'Status', width: 100 },
          ]}
          pageSize={10}
          checkboxSelection
        />
      </div>
    </div>
  );
};
