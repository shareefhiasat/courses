import React, { useState } from 'react';
import { Button, Card, CardBody } from './ui';
import { Bell, Volume2, Vibrate, Smartphone } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { useLang } from '../contexts/LangContext';

const NotificationTester = () => {
  const { t } = useLang();
  const { 
    triggerNotification, 
    initializeNotifications, 
    settings, 
    checkSupport, 
    isMobile,
    isInitializing
  } = useNotifications();
  
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date() }]);
  };

  const runTest = async (testName, testFunction) => {
    try {
      const result = await testFunction();
      addTestResult(testName, result, result ? 'Success' : 'Failed');
      return result;
    } catch (error) {
      addTestResult(testName, false, error.message);
      return false;
    }
  };

  const testSound = () => runTest('Sound', async () => {
    await triggerNotification('default', null, null, { settings: { sound: true, vibration: false, browser: false } });
    return true;
  });

  const testVibration = () => runTest('Vibration', async () => {
    await triggerNotification('default', null, null, { settings: { sound: false, vibration: true, browser: false } });
    return true;
  });

  const testBrowserNotification = () => runTest('Browser Notification', async () => {
    await triggerNotification('default', 'Test Notification', 'This is a test notification from the app');
    return true;
  });

  const testFullNotification = () => runTest('Full Notification', async () => {
    await triggerNotification('message', 'Test Message', 'This is a full test with sound, vibration, and browser notification');
    return true;
  });

  const initializeAndTest = async () => {
    const initialized = await initializeNotifications();
    addTestResult('Initialization', initialized, initialized ? 'Permissions granted' : 'Permissions denied');
  };

  const support = checkSupport();

  return (
    <Card>
      <CardBody>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} />
            Notification System Tester
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>
            Test notification sounds, vibration, and browser notifications
          </p>
        </div>

        {/* Support Status */}
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          background: '#f9fafb', 
          borderRadius: 8, 
          border: '1px solid #e5e7eb',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Support Status:</div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <div>🔊 Audio: {support.audio ? '✅ Supported' : '❌ Not Supported'}</div>
            <div>📳 Vibration: {support.vibration ? '✅ Supported' : '❌ Not Supported'}</div>
            <div>🔔 Notifications: {support.notification ? '✅ Supported' : '❌ Not Supported'}</div>
            <div>⚙️ Service Worker: {support.serviceWorker ? '✅ Supported' : '❌ Not Supported'}</div>
            <div>📱 Mobile Device: {isMobile() ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>

        {/* Current Settings */}
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          background: '#f0f9ff', 
          borderRadius: 8, 
          border: '1px solid #0ea5e9',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Current Settings:</div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <div>🔊 Sound: {settings.soundEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>📳 Vibration: {settings.vibrationEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>🔔 Browser Notifications: {settings.browserNotificationsEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>📋 Permissions Requested: {settings.permissionsRequested ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>

        {/* Test Buttons */}
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
          {!settings.permissionsRequested && (
            <Button
              variant="primary"
              onClick={initializeAndTest}
              disabled={isInitializing}
              loading={isInitializing}
              icon={<Bell size={16} />}
            >
              {isInitializing ? 'Requesting Permissions...' : 'Initialize Notifications'}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={testSound}
            disabled={!support.audio || !settings.soundEnabled}
            icon={<Volume2 size={16} />}
          >
            Test Sound Only
          </Button>
          
          <Button
            variant="outline"
            onClick={testVibration}
            disabled={!support.vibration || !settings.vibrationEnabled}
            icon={<Vibrate size={16} />}
          >
            Test Vibration Only
          </Button>
          
          <Button
            variant="outline"
            onClick={testBrowserNotification}
            disabled={!support.notification || !settings.browserNotificationsEnabled}
            icon={<Bell size={16} />}
          >
            Test Browser Notification
          </Button>
          
          <Button
            variant="primary"
            onClick={testFullNotification}
            disabled={!settings.permissionsRequested}
            icon={<Smartphone size={16} />}
          >
            Test Full Notification (Sound + Vibration + Browser)
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Test Results:</h4>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              fontSize: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              padding: '0.5rem'
            }}>
              {testResults.map((result, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.25rem 0',
                  borderBottom: index < testResults.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <span style={{ fontWeight: 500 }}>{result.test}</span>
                  <span style={{ 
                    color: result.success ? '#059669' : '#dc2626',
                    fontWeight: 600
                  }}>
                    {result.success ? '✅' : '❌'} {result.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          background: '#fef3c7', 
          borderRadius: 4, 
          border: '1px solid #f59e0b',
          fontSize: '0.75rem',
          color: '#92400e'
        }}>
          <strong>💡 Tip:</strong> On mobile devices, notifications will work even when the screen is off. On desktop, they work when the browser is in the background.
        </div>
      </CardBody>
    </Card>
  );
};

export default NotificationTester;
