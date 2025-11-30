# 🚀 QUICK REFERENCE - Storybook Components

## Quick Import
```jsx
import { 
  Select, 
  Loading, 
  Input, 
  Button, 
  Modal, 
  useToast 
} from '../components/ui';
```

---

## 🔽 Select Component (with Autocomplete!)

### Basic Usage
```jsx
<Select
  label="Filter"
  options={[
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' }
  ]}
  value={filter}
  onChange={(e) => setFilter(e.target.value)}
/>
```

### With Search (Autocomplete)
```jsx
<Select
  searchable  // 🔥 Enable autocomplete!
  label="Student"
  options={students.map(s => ({ value: s.id, label: s.name }))}
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
/>
```

### Props
- `searchable` - Enable autocomplete/search
- `label` - Label text
- `options` - Array of `{ value, label }`
- `value` - Selected value
- `onChange` - Change handler
- `placeholder` - Placeholder text
- `error` - Error message
- `helperText` - Helper text
- `disabled` - Disable select
- `required` - Required field
- `size` - 'small' | 'medium' | 'large'
- `fullWidth` - Take full width

---

## ⏳ Loading Component

### Overlay (Fullscreen)
```jsx
{loading && <Loading variant="overlay" message="Loading data..." />}
```

### Inline
```jsx
{loading && <Loading variant="inline" size="sm" />}
```

### Props
- `variant` - 'spinner' | 'fancy' | 'overlay' | 'fullscreen' | 'inline'
- `size` - 'sm' | 'md' | 'lg' | 'xl'
- `message` - Loading message
- `fullscreen` - Fullscreen mode
- `overlay` - Overlay mode

---

## 🔘 Button Component

### Basic
```jsx
<Button onClick={handleClick}>
  Click Me
</Button>
```

### With Icon
```jsx
<Button 
  icon={<Download size={16} />}
  variant="primary"
  onClick={handleExport}
>
  Export
</Button>
```

### Variants
- `primary` - Purple background
- `secondary` - Gray background
- `outline` - Border only
- `ghost` - No background
- `danger` - Red background
- `success` - Green background

### Sizes
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

---

## 📝 Input Component

### Basic
```jsx
<Input
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Enter name..."
/>
```

### With Validation
```jsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  helperText="Enter a valid email"
  required
/>
```

---

## 🔔 Toast Notifications

### Usage
```jsx
const toast = useToast();

// Success
toast.success('Saved successfully!');

// Error
toast.error('Failed to save');

// Warning
toast.warning('Please check your input');

// Info
toast.info('New update available');
```

---

## 🪟 Modal Component

### Basic
```jsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Delete"
>
  <p>Are you sure you want to delete this item?</p>
  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
    <Button onClick={handleDelete} variant="danger">Delete</Button>
    <Button onClick={() => setIsOpen(false)} variant="outline">Cancel</Button>
  </div>
</Modal>
```

---

## 📊 Common Patterns

### Page with Loading
```jsx
const [loading, setLoading] = useState(true);

if (loading) {
  return <Loading variant="overlay" message="Loading..." />;
}

return (
  <Container>
    {/* Your content */}
  </Container>
);
```

### Page with Filters
```jsx
const [classFilter, setClassFilter] = useState('all');
const [statusFilter, setStatusFilter] = useState('all');

<div style={{ display: 'flex', gap: '1rem' }}>
  <Select
    searchable
    label="Class"
    options={classes}
    value={classFilter}
    onChange={(e) => setClassFilter(e.target.value)}
  />
  <Select
    searchable
    label="Status"
    options={statuses}
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  />
</div>
```

### Form with Validation
```jsx
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState({});
const toast = useToast();

const handleSubmit = async () => {
  try {
    await saveData(formData);
    toast.success('Saved successfully!');
  } catch (error) {
    toast.error('Failed to save');
  }
};

<form onSubmit={handleSubmit}>
  <Input
    label="Name"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    error={errors.name}
    required
  />
  <Input
    label="Email"
    type="email"
    value={formData.email}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
    error={errors.email}
    required
  />
  <Button type="submit" variant="primary">Save</Button>
</form>
```

---

## 🎨 Styling

### Use CSS Modules
```jsx
import styles from './MyPage.module.css';

<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

### Avoid Inline Styles
```jsx
// ❌ Don't do this
<div style={{ padding: '1rem', background: '#fff' }}>

// ✅ Do this
<div className={styles.card}>
```

---

## 🌓 Dark Mode

All components support dark mode automatically using CSS variables:
- `--text` - Text color
- `--bg` - Background color
- `--panel` - Panel background
- `--border` - Border color
- `--primary` - Primary color

---

## 🌍 RTL Support

All components support RTL (Arabic) automatically. No extra code needed!

---

## 📱 Mobile Responsive

All components are mobile-responsive by default. Use:
- `fullWidth` prop for full-width components
- CSS Grid/Flexbox for layouts
- Media queries in CSS modules

---

## ✅ Best Practices

1. **Always use searchable Select** for better UX
2. **Use Loading overlay** for page loading
3. **Use Toast** instead of alert()
4. **Use Modal** instead of confirm()
5. **Import from single source** (`../components/ui`)
6. **Use CSS modules** instead of inline styles
7. **Add validation** to forms
8. **Show error messages** with toast
9. **Test dark mode** and RTL
10. **Keep it simple** and consistent

---

## 🎯 Pages with Autocomplete

These pages have searchable dropdowns:
1. `/leaderboard` - 2 filters
2. `/student-progress` - 4 filters
3. `/student-profile` - 4 filters
4. `/attendance` - 3 filters
5. `/hr-attendance` - 3 filters
6. `/attendance-management` - 2 filters
7. `/class-schedules` - 1 filter
8. `/my-attendance` - 7 filters
9. `/role-access` - 1 filter

**Total: 28 searchable dropdowns!**

---

## 🚀 Quick Start

1. Import components from `../components/ui`
2. Use `searchable` prop on Select for autocomplete
3. Use `variant="overlay"` on Loading for fullscreen
4. Use `useToast()` for notifications
5. Test dark mode and RTL
6. Deploy! 🎉

---

**Happy coding! 🚀**
