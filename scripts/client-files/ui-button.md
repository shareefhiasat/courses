# Button Component

A reusable button component with multiple variants, sizes, and states.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Button content (text, icons, etc.) |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style of the button |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the button |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `loading` | `boolean` | `false` | Shows loading spinner and disables button |
| `fullWidth` | `boolean` | `false` | Makes button take full width of container |
| `onClick` | `function` | - | Click event handler |
| `className` | `string` | `''` | Additional CSS classes |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |

## Usage Examples

### Basic Usage

```jsx
import Button from '@/components/ui/Button';

function MyComponent() {
  return (
    <Button onClick={() => console.log('clicked')}>
      Click Me
    </Button>
  );
}
```

### Variants

```jsx
// Primary (default)
<Button variant="primary">Primary Button</Button>

// Secondary
<Button variant="secondary">Secondary Button</Button>

// Outline
<Button variant="outline">Outline Button</Button>

// Ghost
<Button variant="ghost">Ghost Button</Button>

// Danger
<Button variant="danger">Delete</Button>
```

### Sizes

```jsx
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>
```

### States

```jsx
// Disabled
<Button disabled>Disabled Button</Button>

// Loading
<Button loading>Saving...</Button>

// Full Width
<Button fullWidth>Full Width Button</Button>
```

### With Icons

```jsx
import { Plus, Trash2 } from 'lucide-react';

<Button>
  <Plus size={16} />
  Add Item
</Button>

<Button variant="danger">
  <Trash2 size={16} />
  Delete
</Button>
```

### Form Submit

```jsx
<form onSubmit={handleSubmit}>
  <Button type="submit" variant="primary">
    Submit Form
  </Button>
</form>
```

## Accessibility

- Uses semantic `<button>` element
- Supports keyboard navigation
- Focus visible outline for keyboard users
- Disabled state prevents interaction
- Loading state prevents double-submission

## Styling

The component uses CSS Modules for scoped styling. You can customize colors and spacing by overriding CSS variables:

```css
:root {
  --color-primary: #800020;
  --color-primary-dark: #600018;
  --color-secondary: #6c757d;
  --color-danger: #dc3545;
  --radius-md: 8px;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
}
```

## Best Practices

1. Use `variant="primary"` for main actions
2. Use `variant="secondary"` for less important actions
3. Use `variant="danger"` for destructive actions (delete, remove)
4. Use `variant="outline"` or `variant="ghost"` for tertiary actions
5. Always provide meaningful button text or aria-label
6. Use `loading` state to prevent double-submission
7. Use `disabled` for unavailable actions
