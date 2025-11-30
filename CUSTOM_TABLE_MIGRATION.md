# 🔄 Custom Table Migration Guide

## 📋 Files with Custom Tables to Migrate

This document tracks all files that need table/grid migration to use the Storybook components.

---

## ✅ Migration Status

### High Priority (User-facing data tables)

#### 1. **HRAttendancePage.jsx** - Line 281
**Current**: Custom export button
```jsx
<button onClick={() => exportSessionCSV(selectedSession.id)} 
  style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 8, background: '#10b981', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
  <FileDown size={16} />
  {t('export_csv') || 'Export CSV'}
</button>
```

**Replace with**:
```jsx
import { Button } from '../components/ui';

<Button 
  variant="success" 
  icon={<FileDown size={16} />}
  onClick={() => exportSessionCSV(selectedSession.id)}
>
  {t('export_csv') || 'Export CSV'}
</Button>
```

---

#### 2. **AttendancePage.jsx** - Line 360
**Current**: Custom export button
```jsx
<button onClick={exportCSV} 
  style={{ padding:'0.5rem 1rem', border:'1px solid var(--border)', borderRadius:8, background:'#fff', fontWeight:600 }}>
  📊 {(t('export_csv')||'Export CSV').replaceAll('_',' ')}
</button>
```

**Replace with**:
```jsx
import { Button } from '../components/ui';

<Button 
  variant="secondary" 
  icon={<Download size={16} />}
  onClick={exportCSV}
>
  {t('export_csv') || 'Export CSV'}
</Button>
```

---

#### 3. **ManualAttendancePage.jsx** - Line 453
**Current**: Custom export button
```jsx
<button onClick={exportCSV}
  style={{
    padding: '0.5rem 1rem',
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: '#10b981',
    color: 'white',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  }}
>
  <Download size={18} />
  {t('export') || 'Export CSV'}
</button>
```

**Replace with**:
```jsx
import { Button } from '../components/ui';

<Button 
  variant="success" 
  icon={<Download size={18} />}
  onClick={exportCSV}
>
  {t('export') || 'Export CSV'}
</Button>
```

---

#### 4. **StudentAttendancePage.jsx** - Line 336
**Current**: Custom export button
```jsx
<button onClick={exportHistory} 
  style={{ padding:'0.4rem 0.75rem', borderRadius:8, border:'1px solid var(--border)', background:'#fff' }}>
  {(t('export_csv')||'Export CSV').replaceAll('_',' ')}
</button>
```

**Replace with**:
```jsx
import { Button } from '../components/ui';

<Button 
  variant="secondary" 
  size="sm"
  icon={<Download size={16} />}
  onClick={exportHistory}
>
  {t('export_csv') || 'Export CSV'}
</Button>
```

---

### Medium Priority (Analytics & Reports)

#### 5. **AnalyticsPage.jsx** - Line 187
**Status**: ✅ Already migrated to Button component

#### 6. **QuizResultsPage.jsx** - Line 132
**Status**: ✅ Already migrated to Button component

#### 7. **LeaderboardPage.jsx** - Line 207
**Status**: ✅ Already migrated to Button component

---

## 🔍 Search for Custom Tables

### Command to find custom tables:
```bash
# Find all <table> tags
grep -r "<table" client/src/pages --include="*.jsx"

# Find custom styled buttons
grep -r "style={{.*padding.*background" client/src/pages --include="*.jsx"

# Find export CSV buttons
grep -r "export.*csv\|Export CSV" client/src/pages --include="*.jsx" -i
```

---

## 📊 Table Migration Examples

### Example 1: Simple Data Table

**Before**:
```jsx
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {students.map(student => (
      <tr key={student.id}>
        <td>{student.name}</td>
        <td>{student.email}</td>
        <td>{student.status}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**After**:
```jsx
import { Table } from '../components/ui';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status' },
];

<Table 
  columns={columns} 
  data={students}
  striped
  hoverable
  loading={loading}
/>
```

---

### Example 2: Advanced Data Grid with Actions

**Before**:
```jsx
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {students.map(student => (
      <tr key={student.id}>
        <td>{student.name}</td>
        <td>{student.email}</td>
        <td>
          <button onClick={() => handleEdit(student)}>Edit</button>
          <button onClick={() => handleDelete(student)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
<button onClick={exportCSV}>Export CSV</button>
```

**After**:
```jsx
import { DataGrid, Button } from '../components/ui';
import { Edit, Trash2 } from 'lucide-react';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  {
    key: 'actions',
    label: 'Actions',
    render: (_, row) => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button 
          size="sm" 
          variant="ghost" 
          icon={<Edit size={16} />}
          onClick={() => handleEdit(row)}
        >
          Edit
        </Button>
        <Button 
          size="sm" 
          variant="danger" 
          icon={<Trash2 size={16} />}
          onClick={() => handleDelete(row)}
        >
          Delete
        </Button>
      </div>
    )
  }
];

<DataGrid 
  columns={columns} 
  data={students}
  selectable
  onSelectionChange={setSelectedStudents}
  onExport={(data) => exportToCSV(data)}
  loading={loading}
  pageSize={10}
/>
```

---

### Example 3: Attendance Records Table

**Before**:
```jsx
<div style={{ overflowX: 'auto' }}>
  <table>
    <thead>
      <tr>
        <th>Student</th>
        <th>Date</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {records.map(record => (
        <tr key={record.id}>
          <td>{record.studentName}</td>
          <td>{new Date(record.date).toLocaleDateString()}</td>
          <td>
            <span style={{ 
              padding: '0.25rem 0.5rem', 
              borderRadius: 4, 
              background: record.status === 'present' ? '#10b981' : '#ef4444',
              color: 'white'
            }}>
              {record.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**After**:
```jsx
import { DataGrid, Badge } from '../components/ui';

const columns = [
  { key: 'studentName', label: 'Student', sortable: true },
  { 
    key: 'date', 
    label: 'Date', 
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString()
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <Badge color={value === 'present' ? 'success' : 'danger'}>
        {value}
      </Badge>
    )
  }
];

<DataGrid 
  columns={columns} 
  data={records}
  pageSize={20}
  loading={loading}
  emptyMessage="No attendance records found"
/>
```

---

## 🎯 Quick Migration Steps

### For Each Custom Table:

1. **Identify the table structure**
   - What columns does it have?
   - Does it need sorting?
   - Does it need actions (edit, delete)?
   - Does it need export?

2. **Choose the right component**
   - Simple display → `Table`
   - Advanced features (search, export, pagination) → `DataGrid`

3. **Define columns array**
   ```jsx
   const columns = [
     { key: 'fieldName', label: 'Display Name', sortable: true },
     // ... more columns
   ];
   ```

4. **Add custom renderers if needed**
   ```jsx
   {
     key: 'status',
     label: 'Status',
     render: (value, row) => <Badge color={value}>{value}</Badge>
   }
   ```

5. **Replace the table**
   ```jsx
   <DataGrid columns={columns} data={data} loading={loading} />
   ```

6. **Remove custom export buttons**
   - DataGrid has built-in export functionality

---

## ✅ Migration Checklist

- [ ] HRAttendancePage.jsx - Export button
- [ ] AttendancePage.jsx - Export button
- [ ] ManualAttendancePage.jsx - Export button
- [ ] StudentAttendancePage.jsx - Export button
- [ ] Search for remaining custom tables
- [ ] Replace all custom styled buttons with Button component
- [ ] Add loading states to all tables
- [ ] Test all table functionality
- [ ] Verify export functionality works
- [ ] Check responsive design on mobile

---

## 📝 Notes

- **DataGrid** includes built-in search, sort, pagination, and export
- **Table** is lighter weight for simple data display
- Both support custom cell rendering via `render` function
- Both support loading states
- Both are fully responsive and dark-mode compatible

---

**Last Updated**: November 2024  
**Priority**: High - Improves UX consistency and maintainability
