# JoyrideTour Component

A reusable React component for creating guided tours using react-joyride with built-in theme support and localization.

## Usage

```jsx
import JoyrideTour from '@ui/JoyrideTour';

const MyComponent = () => {
  const [runTour, setRunTour] = useState(false);
  
  return (
    <div>
      {/* Your component content */}
      
      <JoyrideTour
        run={runTour}
        mode="activities"
        activityType="quiz"
        tourSeenKey="myComponentTourSeen"
        onTourFinish={() => setRunTour(false)}
      />
    </div>
  );
};
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `run` | boolean | Controls whether the tour should run |
| `onTourFinish` | function | Callback function called when tour finishes or is skipped |
| `mode` | string | Current mode (e.g., 'activities', 'resources') |
| `activityType` | string | Current activity type (e.g., 'quiz', 'homework') |
| `tourSeenKey` | string | localStorage key to track if tour was shown |
| `steps` | array | Custom tour steps (optional - uses default steps if not provided) |
| `customStyles` | object | Custom styles to override default theme styles |

## Features

- **Theme Support**: Automatically adapts to light/dark themes
- **Localization**: Built-in support for multiple languages
- **LocalStorage**: Automatically tracks when tours are completed
- **Flexible**: Can use default steps or provide custom steps
- **Responsive**: Works on all screen sizes

## Default Steps

The component includes default steps for HomePage that cover:
- Mode switcher tabs
- Statistics section
- Search functionality
- Filters and status filters
- Difficulty filters
- Activity type tabs (when in activities mode)
- Category tabs (when in activities mode)
- Class filter (when in activities + quiz mode)
- Resource type filters (when in resources mode)
- Cards grid

## Custom Steps

You can provide custom steps:

```jsx
const customSteps = [
  {
    target: '[data-tour="my-element"]',
    content: 'This is my custom tour step',
    placement: 'bottom',
    disableBeacon: true
  }
];

<JoyrideTour
  run={runTour}
  steps={customSteps}
  onTourFinish={() => setRunTour(false)}
/>
```

## Data Attributes

Make sure to add `data-tour` attributes to your elements:

```jsx
<div data-tour="my-element">
  Content to highlight
</div>
```
