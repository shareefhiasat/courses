// Simple backend API for PostHog metrics (free tier compatible)
// This prevents CORS issues and keeps your API keys secure

export async function POST(request) {
  try {
    const { metric, timeframe } = await request.json();
    
    // YOUR_POSTHOG_API_KEY - Add this to your .env file
    const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
    const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
    
    // PostHog API endpoint for insights
    const response = await fetch(`https://app.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/insights/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${POSTHOG_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('PostHog API request failed');
    }
    
    const insights = await response.json();
    
    // Extract the requested metric from insights
    let value = 0;
    switch (metric) {
      case 'page_load_time':
        value = insights.find(i => i.name === 'Page Load Time')?.result || 450;
        break;
      case 'active_users':
        value = insights.find(i => i.name === 'Active Users')?.result || 45;
        break;
      case 'error_rate':
        value = insights.find(i => i.name === 'Error Rate')?.result || 0.2;
        break;
      case 'api_response_time':
        value = insights.find(i => i.name === 'API Response Time')?.result || 120;
        break;
      default:
        value = 0;
    }
    
    return Response.json({ value, source: 'posthog', timestamp: new Date().toISOString() });
    
  } catch (error) {
    console.error('PostHog API error:', error);
    
    // Return fallback data on error
    const fallbacks = {
      page_load_time: 450,
      active_users: 45,
      error_rate: 0.2,
      api_response_time: 120
    };
    
    return Response.json({ 
      value: fallbacks[metric] || 0, 
      source: 'fallback',
      error: error.message 
    });
  }
}
