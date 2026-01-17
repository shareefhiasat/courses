# Mobile Notification System

This notification system provides comprehensive sound and vibration notifications that work even when the phone is asleep, similar to native mobile app notifications.

## Features

### 🔊 Audio Notifications
- **Web Audio API**: Uses oscillator-based sound generation for instant playback
- **No external files**: Sounds are generated programmatically
- **Different tones**: Unique sounds for different notification types
- **Mobile optimized**: Works even when screen is off on mobile devices

### 📳 Vibration Patterns
- **Native Vibration API**: Uses device vibration hardware
- **Multiple patterns**: Different patterns for different notification types
- **Mobile focused**: Works on Android and iOS devices
- **Background support**: Vibrates even when app is in background

### 🔔 Browser Notifications
- **Service Worker**: Enhanced mobile support via service worker
- **Background operation**: Works when browser is minimized
- **Click handling**: Opens app when notification is clicked
- **Auto-dismiss**: Notifications auto-close after 5 seconds

### 📱 Mobile Optimization
- **Sleep mode support**: Notifications work when phone is asleep
- **Background operation**: Works when app is in background
- **Battery efficient**: Minimal battery usage
- **Cross-platform**: Works on Android and iOS

## Architecture

### Core Components

1. **NotificationManager** (`utils/notifications.js`)
   - Main notification engine
   - Handles audio, vibration, and browser notifications
   - Manages permissions and settings

2. **useNotifications Hook** (`hooks/useNotifications.js`)
   - React integration
   - Settings management
   - Firebase integration

3. **Service Worker** (`public/sw.js`)
   - Background notification handling
   - Offline support
   - Push notification foundation

4. **ServiceWorkerManager** (`utils/serviceWorker.js`)
   - Service worker registration
   - Push notification setup
   - Local notification handling

### Integration Points

1. **ProfileSettingsPage**: User settings and permissions
2. **NotificationBell**: Real-time notification triggers
3. **NotificationTester**: Development and testing tool

## Usage

### Basic Usage

```javascript
import useNotifications from '../hooks/useNotifications';

const MyComponent = () => {
  const { triggerNotification } = useNotifications();

  const handleNotification = async () => {
    await triggerNotification(
      'message',           // type
      'New Message',      // title
      'You have a new message', // message
      {
        settings: {
          sound: true,
          vibration: true,
          browser: true
        }
      }
    );
  };

  return <button onClick={handleNotification}>Test Notification</button>;
};
```

### Advanced Usage

```javascript
import notificationManager from '../utils/notifications';

// Initialize permissions
await notificationManager.initializeOnUserInteraction();

// Play custom sound
notificationManager.playNotificationSound('success');

// Trigger custom vibration
notificationManager.vibrate('double');

// Show browser notification
await notificationManager.showBrowserNotification(
  'Custom Title',
  {
    body: 'Custom message',
    vibrate: [200, 100, 200],
    tag: 'custom-tag'
  }
);
```

## Notification Types

### Sound Types
- `default`: Standard notification beep
- `message`: Chat message tone (descending)
- `success`: Success chime (ascending)
- `warning`: Warning tone
- `error`: Error tone (descending)

### Vibration Patterns
- `default`: Single 100ms vibration
- `short`: 50ms vibration
- `long`: 200ms-100ms-200ms pattern
- `double`: 100ms-50ms-100ms pattern
- `triple`: 100ms-50ms-100ms-50ms-100ms pattern

## Settings

### User Settings (stored in Firebase)
```javascript
{
  notificationSoundEnabled: boolean,
  notificationVibrationEnabled: boolean,
  browserNotificationsEnabled: boolean,
  notificationPermissionsRequested: boolean
}
```

### Local Storage (permissions cache)
```javascript
{
  notification: 'granted' | 'denied' | 'default',
  sound: boolean,
  vibration: boolean
}
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Audio API | ✅ | ✅ | ✅ | ✅ |
| Vibration API | ✅ | ❌ | ❌ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |

## Mobile Support

### Android
- ✅ Full support
- ✅ Sleep mode notifications
- ✅ Background notifications
- ✅ Vibration patterns

### iOS
- ✅ Audio notifications
- ✅ Browser notifications
- ⚠️ Limited vibration support
- ⚠️ Background limitations

## Permissions

### Required Permissions
1. **Notification Permission**: Required for browser notifications
2. **User Interaction**: Required for audio context initialization
3. **Service Worker**: Auto-registered for enhanced support

### Permission Flow
1. User clicks "Enable Notifications"
2. System requests notification permission
3. Audio context is initialized
4. Service worker is registered
5. Settings are saved to Firebase

## Testing

Use the **NotificationTester** component to test all features:

```javascript
import NotificationTester from '../components/NotificationTester';

// In your component
<NotificationTester />
```

The tester provides:
- Support status detection
- Current settings display
- Individual feature testing
- Full notification testing
- Real-time test results

## Troubleshooting

### Common Issues

1. **No sound on mobile**
   - Ensure user interaction occurred first
   - Check audio context state
   - Verify device volume

2. **No vibration**
   - Vibration API not supported (iOS, some browsers)
   - Check device settings
   - Verify vibration is enabled

3. **No browser notifications**
   - Permission not granted
   - Browser blocks notifications
   - HTTPS required for production

4. **Background not working**
   - Service worker not registered
   - Browser background throttling
   - Battery saver mode

### Debug Tools

```javascript
// Check support
console.log(notificationManager.isSupported);

// Check permissions
console.log(notificationManager.permissions);

// Test individual features
await notificationManager.playNotificationSound('default');
notificationManager.vibrate('default');
await notificationManager.showBrowserNotification('Test');
```

## Performance

### Optimization Features
- Lazy loading of audio context
- Efficient vibration patterns
- Minimal service worker footprint
- Smart notification triggering

### Battery Impact
- Low CPU usage for audio generation
- Minimal vibration duration
- Efficient service worker operations
- Background throttling awareness

## Security

### Security Features
- HTTPS requirement for notifications
- User interaction requirement
- Permission validation
- Safe audio context handling

### Best Practices
- Always request permissions on user interaction
- Provide clear permission explanations
- Respect user preferences
- Handle permission denials gracefully

## Future Enhancements

### Planned Features
- Push notifications with backend integration
- Custom sound uploads
- Advanced vibration patterns
- Notification scheduling
- Notification history
- Do-not-disturb modes

### Backend Integration
```javascript
// Future push notification setup
await serviceWorkerManager.subscribeToPush();
// Send to backend for push notifications
```

## Contributing

When modifying the notification system:

1. Test on both mobile and desktop
2. Verify permission flows
3. Check background behavior
4. Update documentation
5. Add test cases

## License

This notification system is part of the courses application and follows the same licensing terms.
