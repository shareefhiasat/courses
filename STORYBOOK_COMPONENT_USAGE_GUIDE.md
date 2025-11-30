# 🎨 Storybook Component Usage Guide

## 📋 Table of Contents
1. [Loading States](#loading-states)
2. [Toast Notifications](#toast-notifications)
3. [Modals](#modals)
4. [Data Tables & Grids](#data-tables--grids)
5. [Buttons & Badges](#buttons--badges)
6. [Migration Checklist](#migration-checklist)

---

## 🔄 Loading States

### ✅ DO: Use the unified `Loading` component

```jsx
import { Loading } from '../components/ui';

// Simple centered spinner
<Loading />

// With message
<Loading message="Loading data..." />

// Fullscreen overlay
<Loading variant="overlay" message="Processing..." />

// Fancy loading animation
<Loading variant="fancy" fancyVariant="dots" message="Please wait..." />

// Inline loading (for buttons, etc.)
<Loading variant="inline" size="sm" message="Saving..." />
```

### ❌ DON'T: Use custom loading implementations

```jsx
// ❌ Bad - Custom loading div
<div style={{ textAlign: 'center', padding: '2rem' }}>
  <div className="spinner"></div>
  <p>Loading...</p>
</div>

// ❌ Bad - Old Loading component
import Loading from '../components/Loading';

// ❌ Bad - Inline spinners without component
<div>Loading...</div>
```

### 📦 Loading Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'spinner' \| 'fancy' \| 'overlay' \| 'fullscreen' \| 'inline'` | `'spinner'` | Loading style |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size of spinner |
| `message` | `string` | `''` | Optional message |
| `fancyVariant` | `'dots' \| 'pulse' \| 'bars' \| 'ring' \| 'dual-ring'` | `'dots'` | Fancy animation type |

---

## 🔔 Toast Notifications

### ✅ DO: Use the `useToast` hook

```jsx
import { useToast } from '../components/ui';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('An error occurred. Please try again.');
  };

  const handleWarning = () => {
    toast.warning('This action cannot be undone.');
  };

  const handleInfo = () => {
    toast.info('You have 3 new notifications.');
  };

  return (
    <Button onClick={handleSuccess}>Save</Button>
  );
}
```

### ❌ DON'T: Use old toast implementations

```jsx
// ❌ Bad - Old ToastProvider
import { useToast } from '../components/ToastProvider';

// ❌ Bad - setMessage state
const [message, setMessage] = useState('');
setMessage('Success!');

// ❌ Bad - alert()
alert('Success!');

// ❌ Bad - Custom toast div
<div className="toast">Success!</div>
```

### 📦 Toast API

```jsx
const toast = useToast();

// Methods
toast.success(message, options);
toast.error(message, options);
toast.warning(message, options);
toast.info(message, options);

// Options
{
  duration: 3000,        // Auto-dismiss after 3s
  position: 'top-right', // Position on screen
  dismissible: true      // Show close button
}
```

---

## 🪟 Modals

### ✅ DO: Use the `Modal` component

```jsx
import { Modal, Button } from '../components/ui';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        size="md"
      >
        <p>Are you sure you want to proceed?</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <Button variant="primary" onClick={() => setIsOpen(false)}>
            Confirm
          </Button>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

### ❌ DON'T: Use native dialogs or custom modals

```jsx
// ❌ Bad - window.confirm
if (window.confirm('Are you sure?')) {
  // do something
}

// ❌ Bad - Custom modal div
<div className="modal-overlay">
  <div className="modal-content">...</div>
</div>
```

### 📦 Modal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Controls visibility |
| `onClose` | `function` | - | Close handler |
| `title` | `string` | - | Modal title |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal size |
| `closeOnOverlay` | `boolean` | `true` | Close on backdrop click |
| `showClose` | `boolean` | `true` | Show close button |

---

## 📊 Data Tables & Grids

### ✅ DO: Use `DataGrid` for advanced tables

```jsx
import { DataGrid, Button, Badge } from '../components/ui';

function StudentsTable() {
  const columns = [
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true 
    },
    { 
      key: 'email', 
      label: 'Email', 
      sortable: true 
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <Badge color={value === 'active' ? 'success' : 'danger'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button size="sm" onClick={() => handleEdit(row)}>
          Edit
        </Button>
      )
    }
  ];

  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  ];

  return (
    <DataGrid
      columns={columns}
      data={data}
      selectable
      onSelectionChange={(selected) => console.log(selected)}
      pageSize={10}
      loading={isLoading}
      emptyMessage="No students found"
    />
  );
}
```

### ✅ DO: Use `Table` for simple tables

```jsx
import { Table } from '../components/ui';

function SimpleTable() {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value' },
  ];

  const data = [
    { name: 'Total Students', value: 150 },
    { name: 'Active Courses', value: 12 },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      striped
      hoverable
      loading={isLoading}
    />
  );
}
```

### ❌ DON'T: Use custom HTML tables

```jsx
// ❌ Bad - Custom table with inline styles
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    {data.map(row => (
      <tr key={row.id}>
        <td>{row.name}</td>
        <td>{row.email}</td>
      </tr>
    ))}
  </tbody>
</table>

// ❌ Bad - Custom export button
<button onClick={exportCSV} style={{ padding: '0.5rem 1rem', background: '#10b981' }}>
  Export CSV
</button>
```

### 📦 DataGrid Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `array` | `[]` | Column definitions |
| `data` | `array` | `[]` | Table data |
| `selectable` | `boolean` | `false` | Enable row selection |
| `onSelectionChange` | `function` | - | Selection handler |
| `pageSize` | `number` | `10` | Rows per page |
| `loading` | `boolean` | `false` | Show loading state |
| `emptyMessage` | `string` | `'No data available'` | Empty state message |
| `onExport` | `function` | - | Custom export handler |

### 📦 Table Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `array` | - | Column definitions |
| `data` | `array` | - | Table data |
| `sortable` | `boolean` | `true` | Enable sorting |
| `selectable` | `boolean` | `false` | Enable selection |
| `striped` | `boolean` | `true` | Striped rows |
| `hoverable` | `boolean` | `true` | Hover effect |
| `bordered` | `boolean` | `false` | Table borders |
| `compact` | `boolean` | `false` | Compact spacing |
| `loading` | `boolean` | `false` | Show loading state |

---

## 🎯 Buttons & Badges

### ✅ DO: Use component library buttons

```jsx
import { Button, Badge } from '../components/ui';

// Primary action
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Secondary action
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

// Danger action
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>

// With icon
<Button variant="primary" icon={<Download size={18} />}>
  Export CSV
</Button>

// Loading state
<Button variant="primary" loading disabled>
  Saving...
</Button>

// Badges
<Badge color="success">Active</Badge>
<Badge color="danger">Inactive</Badge>
<Badge color="warning">Pending</Badge>
<Badge color="info">New</Badge>
```

### ❌ DON'T: Use custom buttons

```jsx
// ❌ Bad - Inline styled button
<button 
  onClick={handleClick}
  style={{ 
    padding: '0.5rem 1rem', 
    background: '#10b981', 
    color: 'white',
    border: 'none',
    borderRadius: 8
  }}
>
  Click Me
</button>

// ❌ Bad - Custom CSS class button
<button className="custom-btn-primary" onClick={handleClick}>
  Click Me
</button>
```

---

## ✅ Migration Checklist

### Phase 1: Loading States
- [ ] Replace all `Loading` component imports with `{ Loading } from '../components/ui'`
- [ ] Replace custom loading divs with `<Loading />`
- [ ] Replace inline "Loading..." text with `<Loading variant="inline" />`
- [ ] Add loading states to all async operations

### Phase 2: Toast Notifications
- [ ] Replace `useToast` from `ToastProvider` with `{ useToast } from '../components/ui'`
- [ ] Replace `setMessage` state with `toast.success/error/warning/info`
- [ ] Replace `alert()` calls with `toast` methods
- [ ] Remove custom toast implementations

### Phase 3: Modals
- [ ] Replace `window.confirm()` with `<Modal />` component
- [ ] Replace custom modal divs with `<Modal />` component
- [ ] Add proper modal state management with `useState`

### Phase 4: Data Tables
- [ ] Identify all custom HTML tables
- [ ] Replace simple tables with `<Table />`
- [ ] Replace complex tables with `<DataGrid />`
- [ ] Replace custom export buttons with DataGrid's built-in export
- [ ] Add loading states to all tables

### Phase 5: Buttons & Badges
- [ ] Replace all inline-styled buttons with `<Button />`
- [ ] Replace custom CSS buttons with `<Button />`
- [ ] Replace status text with `<Badge />`
- [ ] Ensure all buttons have proper variants

---

## 🎯 Quick Reference

### Import Statement
```jsx
import {
  // Loading
  Loading,
  Spinner,
  FancyLoading,
  
  // Feedback
  useToast,
  Modal,
  
  // Data Display
  Table,
  DataGrid,
  EmptyState,
  
  // UI Elements
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  
  // Form
  Input,
  Select,
  DatePicker,
  FileUpload,
  
  // Layout
  Container,
  Grid,
  Stack,
} from '../components/ui';
```

### Common Patterns

#### Loading Data
```jsx
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
const toast = useToast();

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getData();
      setData(result);
      toast.success('Data loaded successfully');
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

if (loading) return <Loading message="Loading data..." />;

return <DataGrid columns={columns} data={data} />;
```

#### Confirm Action
```jsx
const [showConfirm, setShowConfirm] = useState(false);
const toast = useToast();

const handleDelete = async () => {
  try {
    await deleteItem(id);
    toast.success('Item deleted successfully');
    setShowConfirm(false);
  } catch (error) {
    toast.error('Failed to delete item');
  }
};

return (
  <>
    <Button variant="danger" onClick={() => setShowConfirm(true)}>
      Delete
    </Button>
    
    <Modal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      title="Confirm Delete"
    >
      <p>Are you sure you want to delete this item?</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="ghost" onClick={() => setShowConfirm(false)}>
          Cancel
        </Button>
      </div>
    </Modal>
  </>
);
```

---

## 📚 Additional Resources

- **Storybook**: Run `npm run storybook` to view all components
- **Component Docs**: Check each component's README in `client/src/components/ui/`
- **Examples**: See migrated pages in `client/src/pages/` for real-world usage

---

**Last Updated**: November 2024  
**Version**: 2.0  
**Status**: ✅ All 30 components available
