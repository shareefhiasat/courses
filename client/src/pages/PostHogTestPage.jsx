import React, { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { Container } from '../components/ui';

const PostHogTestPage = () => {
  const posthog = usePostHog();
  const [events, setEvents] = useState([]);
  const [testCount, setTestCount] = useState(0);

  useEffect(() => {
    console.log('🔍 PostHog Test Page - PostHog instance:', {
      hasPostHog: !!posthog,
      userId: posthog?.get_distinct_id(),
      apiKey: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
      apiHost: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      timestamp: new Date().toISOString()
    });

    // Track page visit
    posthog?.capture('posthog_test_page_visited', {
      timestamp: new Date().toISOString(),
      api_key: import.meta.env.VITE_PUBLIC_POSTHOG_KEY?.substring(0, 20) + '...',
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST
    });
  }, [posthog]);

  const sendTestEvent = (eventName, properties = {}) => {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        test_count: testCount + 1,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      }
    };

    console.log('🔍 PostHog Test - Sending event:', event);
    
    posthog?.capture(eventName, event.properties);
    
    setEvents(prev => [...prev, event]);
    setTestCount(prev => prev + 1);
  };

  const identifyUser = () => {
    const userId = `test_user_${Date.now()}`;
    const userProperties = {
      email: 'test@example.com',
      name: 'Test User',
      test_role: 'posthog_tester'
    };

    console.log('🔍 PostHog Test - Identifying user:', { userId, userProperties });
    
    posthog?.identify(userId, userProperties);
    
    sendTestEvent('user_identified', {
      identified_user_id: userId,
      user_properties: userProperties
    });
  };

  const clearEvents = () => {
    setEvents([]);
    setTestCount(0);
  };

  return (
    <Container maxWidth="md" style={{ padding: '2rem' }}>
      <h1>🔍 PostHog Test Dashboard</h1>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem' 
      }}>
        <h3>PostHog Status</h3>
        <p><strong>PostHog Available:</strong> {posthog ? '✅ Yes' : '❌ No'}</p>
        <p><strong>User ID:</strong> {posthog?.get_distinct_id() || 'N/A'}</p>
        <p><strong>API Key:</strong> {import.meta.env.VITE_PUBLIC_POSTHOG_KEY?.substring(0, 20) + '...' || 'N/A'}</p>
        <p><strong>API Host:</strong> {import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'N/A'}</p>
        <p><strong>Test Events Sent:</strong> {testCount}</p>
        <p><strong>Current Port:</strong> {window.location.port}</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>🧪 Test Events</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button onClick={() => sendTestEvent('button_click_test')}>
            🖱️ Button Click Test
          </button>
          <button onClick={() => sendTestEvent('form_interaction_test', { form_type: 'test_form' })}>
            📝 Form Interaction Test
          </button>
          <button onClick={() => sendTestEvent('page_scroll_test', { scroll_depth: '50%' })}>
            📜 Scroll Test
          </button>
          <button onClick={() => sendTestEvent('error_test', { error_type: 'test_error' })}>
            ❌ Error Test
          </button>
          <button onClick={() => sendTestEvent('purchase_test', { amount: 99.99, currency: 'USD' })}>
            💳 Purchase Test
          </button>
          <button onClick={identifyUser}>
            👤 Identify User Test
          </button>
        </div>
        <button onClick={clearEvents} style={{ background: '#ff6b6b', color: 'white' }}>
          🗑️ Clear Events
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>📊 Recent Events</h3>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          maxHeight: '300px', 
          overflow: 'auto' 
        }}>
          {events.length === 0 ? (
            <p style={{ padding: '1rem', color: '#666' }}>No events sent yet. Click test buttons above!</p>
          ) : (
            events.map((event, index) => (
              <div key={index} style={{ 
                padding: '0.5rem', 
                borderBottom: '1px solid #eee',
                fontSize: '0.9rem'
              }}>
                <strong>{event.name}</strong>
                <br />
                <pre style={{ fontSize: '0.8rem', color: '#666', margin: '0.25rem 0' }}>
                  {JSON.stringify(event.properties, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ 
        background: '#e3f2fd', 
        padding: '1rem', 
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h3>🔗 View in PostHog Dashboard</h3>
        <p><strong>Live Events:</strong> <a href="https://us.posthog.com/project/292734/activity/live" target="_blank" rel="noopener noreferrer">https://us.posthog.com/project/292734/activity/live</a></p>
        <p><strong>Events Explorer:</strong> <a href="https://us.posthog.com/project/292734/activity/explore" target="_blank" rel="noopener noreferrer">https://us.posthog.com/project/292734/activity/explore</a></p>
        <p><strong>Session Replay:</strong> <a href="https://us.posthog.com/project/292734/replay" target="_blank" rel="noopener noreferrer">https://us.posthog.com/project/292734/replay</a></p>
        <p><strong>Project ID:</strong> 292734</p>
        <p><strong>Region:</strong> US Cloud ✅</p>
        <p><strong>Current Port:</strong> {window.location.port} (authorized ✅)</p>
        <p><strong>API Key:</strong> {import.meta.env.VITE_PUBLIC_POSTHOG_KEY?.substring(0, 20) + '...'}</p>
      </div>
    </Container>
  );
};

export default PostHogTestPage;
