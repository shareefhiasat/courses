# 🎨 FancyLoading Component

Beautiful, production-grade loading component with multiple variants and stunning animations.

## ✨ Features

- 🎭 **4 Variants**: Default, Minimal, Dots, Pulse
- 🌈 **Gradient Animations**: Purple → Blue gradients
- 🌓 **Dark Mode**: Full dark mode support
- 📱 **Responsive**: Works on all screen sizes
- ⚡ **Smooth Animations**: CSS-only, no JavaScript
- 🎯 **Fullscreen Option**: Overlay the entire screen
- 🎨 **Customizable**: Messages and variants

---

## 📦 Usage

### Import

```jsx
import { FancyLoading } from '../components/ui';
```

---

## 🎭 Variants

### 1. Default (Recommended)
Beautiful animated logo with gradient spinner and progress bar.

```jsx
<FancyLoading message="Loading your data..." />
```

**Features:**
- Animated logo with rotating rings
- Gradient spinner
- Shimmer text effect
- Progress bar animation
- Pulsing logo

---

### 2. Minimal
Simple spinner with message - perfect for small spaces.

```jsx
<FancyLoading message="Loading..." variant="minimal" />
```

**Features:**
- Clean rotating spinner
- Minimal footprint
- Fast and lightweight

---

### 3. Dots
Three bouncing dots - modern and playful.

```jsx
<FancyLoading message="Processing..." variant="dots" />
```

**Features:**
- Three animated dots
- Staggered bounce effect
- Gradient colors
- Smooth transitions

---

### 4. Pulse
Pulsing rings with logo - attention-grabbing.

```jsx
<FancyLoading message="Initializing..." variant="pulse" />
```

**Features:**
- Expanding pulse rings
- Large logo display
- Smooth fade-out effect
- Eye-catching animation

---

## 🎯 Fullscreen Mode

Cover the entire screen with a beautiful overlay:

```jsx
<FancyLoading 
  message="Please wait while we load your dashboard..." 
  fullscreen 
/>
```

**Features:**
- Covers entire viewport
- Backdrop blur effect
- Semi-transparent background
- Prevents user interaction
- Perfect for page transitions

---

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | `'Loading...'` | Loading message to display |
| `fullscreen` | boolean | `false` | Cover entire screen |
| `variant` | string | `'default'` | Variant: `'default'`, `'minimal'`, `'dots'`, `'pulse'` |

---

## 💡 Examples

### Page Loading
```jsx
const MyPage = () => {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <FancyLoading message="Loading page..." fullscreen />;
  }

  return <div>Page content</div>;
};
```

### Data Fetching
```jsx
const DataComponent = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <FancyLoading message="Fetching data..." variant="dots" />;
  }

  return <div>{/* Render data */}</div>;
};
```

### Form Submission
```jsx
const MyForm = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await submitForm();
    setSubmitting(false);
  };

  return (
    <div>
      {submitting && (
        <FancyLoading 
          message="Saving your changes..." 
          variant="pulse" 
          fullscreen 
        />
      )}
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  );
};
```

### Inline Loading
```jsx
const InlineLoader = () => (
  <div style={{ padding: '2rem' }}>
    <FancyLoading message="Loading..." variant="minimal" />
  </div>
);
```

---

## 🎨 Customization

### Change Logo
Edit `FancyLoading.jsx` line 67:

```jsx
<span className={styles.logoIcon}>📚</span>
// Change to your logo emoji or icon
```

### Change Colors
Edit `FancyLoading.module.css`:

```css
/* Change gradient colors */
.logo {
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  /* Change to your brand colors */
}
```

---

## 🌓 Dark Mode

Automatically adapts to dark mode:

```css
@media (prefers-color-scheme: dark) {
  .fullscreen {
    background: rgba(17, 24, 39, 0.95);
  }
}
```

---

## 📱 Responsive

Adapts to all screen sizes:

```css
@media (max-width: 640px) {
  .logoWrapper {
    width: 100px;
    height: 100px;
  }
}
```

---

## ⚡ Performance

- **CSS-only animations** - No JavaScript overhead
- **GPU-accelerated** - Uses `transform` and `opacity`
- **Lightweight** - ~5KB total (JS + CSS)
- **No dependencies** - Pure React + CSS

---

## 🎯 Best Practices

1. **Use fullscreen for page loads** - Prevents interaction during loading
2. **Use minimal for small spaces** - Keeps UI clean
3. **Use dots for quick operations** - Modern and playful
4. **Use pulse for important actions** - Grabs attention
5. **Always provide a message** - Keeps users informed

---

## 🐛 Troubleshooting

### Loading doesn't show
- Check that component is rendered
- Verify `loading` state is `true`
- Check z-index if using fullscreen

### Animations not smooth
- Ensure CSS modules are loaded
- Check browser compatibility
- Verify no conflicting CSS

### Dark mode not working
- Check system dark mode setting
- Verify CSS media query support
- Test in different browsers

---

## 📄 License

Part of the UI component library. Use freely in your project.

---

## 🙏 Credits

Created with ❤️ using:
- React
- CSS Modules
- Lucide React Icons
- Modern CSS Animations

---

**Enjoy your beautiful loading states!** ✨
