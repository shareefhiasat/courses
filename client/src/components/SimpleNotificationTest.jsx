import React from 'react';
import { Button, Card, CardBody } from './ui';
import { Bell, Volume2, Vibrate, Smartphone } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';

const SimpleNotificationTest = () => {
  const { 
    triggerNotification, 
    initializeNotifications, 
    settings, 
    checkSupport, 
    isMobile,
    isInitializing
  } = useNotifications();

  const testNotification = async () => {
    await triggerNotification('message', 'Test Notification', 'This is a test notification from your app!');
  };

  const support = checkSupport();

  return (
    <Card style={{ margin: '1rem 0' }}>
      <CardBody>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} />
            Quick Notification Test
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>
            Test mobile notification sounds and vibration
          </p>
        </div>

        {/* Support Status */}
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          background: '#f0f9ff', 
          borderRadius: 8, 
          border: '1px solid #0ea5e9',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Mobile Support:</div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <div>📱 Device: {isMobile() ? '✅ Mobile' : '❌ Desktop'}</div>
            <div>🔊 Audio: {support.audio ? '✅ Supported' : '❌ Not Supported'}</div>
            <div>📳 Vibration: {support.vibration ? '✅ Supported' : '❌ Not Supported'}</div>
            <div>🔔 Browser Notifications: {support.notification ? '✅ Supported' : '❌ Not Supported'}</div>
          </div>
        </div>

        {/* Current Settings */}
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          background: '#f9fafb', 
          borderRadius: 8, 
          border: '1px solid #e5e7eb',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Current Settings:</div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <div>🔊 Sound: {settings.soundEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>📳 Vibration: {settings.vibrationEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>🔔 Browser Notifications: {settings.browserNotificationsEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>📋 Permissions: {settings.permissionsRequested ? '✅ Requested' : '❌ Not Requested'}</div>
          </div>
        </div>

        {/* Test Button */}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {!settings.permissionsRequested && (
            <Button
              variant="primary"
              onClick={async () => {
                await initializeNotifications();
                alert('Permissions requested! Try the test button now.');
              }}
              disabled={isInitializing}
              loading={isInitializing}
              icon={<Bell size={16} />}
            >
              {isInitializing ? 'Requesting...' : 'Enable Notifications'}
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={testNotification}
            disabled={!settings.permissionsRequested}
            icon={<Smartphone size={16} />}
          >
            Test Mobile Notification
          </Button>
        </div>

        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#dcfce7', 
          borderRadius: 8, 
          border: '1px solid #22c55e',
          fontSize: '0.875rem',
          color: '#166534'
        }}>
          <strong>✅ Answer to your question:</strong><br/>
          Yes! After you allow notifications, you will get notifications in the mobile drawer just like famous sites. The notifications will work even when your phone is asleep with sound and vibration.
        </div>
      </CardBody>
    </Card>
  );
};

export default SimpleNotificationTest;
