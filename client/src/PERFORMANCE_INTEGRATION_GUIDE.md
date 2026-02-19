# Performance Monitoring Integration Guide

Your performance monitoring system is now ready! Here's how to use it:

## 🚀 Quick Start

### 1. Access the Dashboard
Navigate to `/performance` in your app to see the real-time performance dashboard.

### 2. Monitor Your Services
Wrap your service functions with performance monitoring:

```javascript
import { withPerformanceMonitoring } from '@utils/performance';

// Your existing service
export const getUserData = withPerformanceMonitoring(
  async (userId) => {
    // Your existing logic
    return await userService.getUser(userId);
  },
  'get_user_data' // Operation name for tracking
);
```

### 3. Use in React Components
```javascript
import { usePerformanceMonitoring } from '@hooks/usePerformanceMonitoring';

const MyComponent = () => {
  const { monitorAsync } = usePerformanceMonitoring('component_operation');
  
  const handleClick = async () => {
    await monitorAsync(async () => {
      // Your async operation
      await saveData();
    });
  };
};
```

## 📊 What You Can Monitor

### Real-time Metrics
- **Operation Duration**: Track how long each operation takes
- **Success Rates**: Monitor failure rates
- **Memory Usage**: JavaScript heap usage
- **Active Connections**: Real-time listener count

### Performance Features
- **Automatic Memoization**: Cache frequently accessed data
- **Batch Processing**: Handle multiple operations efficiently
- **Query Optimization**: Paginate and debounce searches
- **Resource Monitoring**: Track memory and connections

## 🔧 Advanced Usage

### Memoized Operations
```javascript
import { memoizedOperations } from '@utils/performance';

// Automatically cached user lookups
const user = await memoizedOperations.getUserById(userId);
```

### Batch Processing
```javascript
import { batchProcessor } from '@utils/performance';

const results = await batchProcessor.processBatch(
  items,
  processItem,
  {
    batchSize: 10,
    maxConcurrency: 3,
    delayBetweenBatches: 100
  }
);
```

### Resource Monitoring
```javascript
import { resourceMonitor } from '@utils/performance';

// Track real-time connections
const connectionId = 'listener-123';
resourceMonitor.addConnection(connectionId);

// Don't forget to cleanup!
resourceMonitor.removeConnection(connectionId);
```

## 🎯 Best Practices

1. **Wrap Critical Operations**: Monitor database queries, API calls, and heavy computations
2. **Use Memoization**: Cache frequently accessed static data
3. **Batch Operations**: Process multiple items together to reduce overhead
4. **Monitor Memory**: Keep an eye on memory usage in long-running sessions
5. **Clean Up Listeners**: Always remove real-time listeners to prevent memory leaks

## 📈 Dashboard Features

- **Real-time Updates**: Metrics refresh automatically (configurable intervals)
- **Health Indicators**: Color-coded status (healthy/warning/critical)
- **Performance Tips**: Built-in recommendations for optimization
- **Export Data**: Clear and reset metrics as needed

## 🔍 Troubleshooting

### No Metrics Showing
- Ensure operations are being wrapped with performance monitoring
- Check that services are actually being called
- Verify the dashboard refresh interval

### High Memory Usage
- Check for unclosed real-time listeners
- Review large data structures in state
- Consider implementing cleanup in useEffect

### Slow Operations
- Use the dashboard to identify bottlenecks
- Consider adding caching or memoization
- Review database query optimization

## 🎉 You're All Set!

Your performance monitoring system is now integrated. Visit `/performance` to start monitoring your app's performance in real-time!
