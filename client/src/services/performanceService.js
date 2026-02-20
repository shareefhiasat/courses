import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@services/other/config';
import logger from '@utils/logger';

/**
 * Performance Service
 * Handles all performance metrics data operations
 */

const COLLECTION_NAME = 'performance_metrics';

/**
 * Get performance metrics for a specific time range
 * @param {string} timeRange - Time range filter (1h, 24h, 7d, 30d)
 * @returns {Promise<Object>} Performance metrics data
 */
export const getPerformanceMetrics = async (timeRange = '1h') => {
  try {
    logger.info('Fetching performance metrics', { timeRange });

    // Calculate time filter based on range
    const now = new Date();
    let timeFilter = new Date();

    switch (timeRange) {
      case '1h':
        timeFilter.setHours(now.getHours() - 1);
        break;
      case '24h':
        timeFilter.setDate(now.getDate() - 1);
        break;
      case '7d':
        timeFilter.setDate(now.getDate() - 7);
        break;
      case '30d':
        timeFilter.setDate(now.getDate() - 30);
        break;
      default:
        timeFilter.setHours(now.getHours() - 1);
    }

    // Query performance metrics collection
    const metricsQuery = query(
      collection(db, COLLECTION_NAME),
      where('timestamp', '>=', timeFilter),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );

    const querySnapshot = await getDocs(metricsQuery);
    
    // Process the data
    const metrics = processMetricsData(querySnapshot.docs, timeRange);
    
    logger.info('Performance metrics retrieved successfully', { 
      count: querySnapshot.docs.length,
      timeRange 
    });

    return metrics;

  } catch (error) {
    logger.error('Failed to get performance metrics:', error);
    throw error;
  }
};

/**
 * Set up real-time listener for performance metrics
 * @param {string} timeRange - Time range filter
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPerformanceMetrics = (timeRange, callback) => {
  try {
    logger.info('Setting up performance metrics subscription', { timeRange });

    // Calculate time filter
    const now = new Date();
    let timeFilter = new Date();

    switch (timeRange) {
      case '1h':
        timeFilter.setHours(now.getHours() - 1);
        break;
      case '24h':
        timeFilter.setDate(now.getDate() - 1);
        break;
      case '7d':
        timeFilter.setDate(now.getDate() - 7);
        break;
      case '30d':
        timeFilter.setDate(now.getDate() - 30);
        break;
      default:
        timeFilter.setHours(now.getHours() - 1);
    }

    const metricsQuery = query(
      collection(db, COLLECTION_NAME),
      where('timestamp', '>=', timeFilter),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );

    const unsubscribe = onSnapshot(
      metricsQuery,
      (querySnapshot) => {
        const metrics = processMetricsData(querySnapshot.docs, timeRange);
        callback(metrics);
      },
      (error) => {
        logger.error('Performance metrics subscription error:', error);
        callback(null, error);
      }
    );

    return unsubscribe;

  } catch (error) {
    logger.error('Failed to set up performance metrics subscription:', error);
    throw error;
  }
};

/**
 * Process raw Firestore data into performance metrics format
 * @param {Array} docs - Firestore document snapshots
 * @param {string} timeRange - Time range filter
 * @returns {Object} Processed performance metrics
 */
const processMetricsData = (docs, timeRange) => {
  // If no data, return default metrics
  if (docs.length === 0) {
    return getDefaultMetrics();
  }

  // Get the most recent data
  const latestDoc = docs[0].data();
  
  // Calculate system health
  const systemHealth = calculateSystemHealth(latestDoc);
  
  // Process key metrics
  const keyMetrics = processKeyMetrics(latestDoc);
  
  // Process performance metrics table
  const performanceMetrics = processPerformanceTable(docs);
  
  // Generate insights
  const insights = generateInsights(docs, timeRange);

  return {
    systemHealth,
    keyMetrics,
    performanceMetrics,
    insights,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Calculate system health score
 * @param {Object} data - Latest metrics data
 * @returns {Object} System health information
 */
const calculateSystemHealth = (data) => {
  let score = 100;
  let status = 'excellent';
  let description = 'All systems operating optimally';

  // Check various health indicators
  const cpuUsage = data.cpuUsage || 0;
  const memoryUsage = data.memoryUsage || 0;
  const errorRate = data.errorRate || 0;
  const responseTime = data.avgResponseTime || 0;

  // Deduct points for issues
  if (cpuUsage > 80) score -= 20;
  if (memoryUsage > 85) score -= 20;
  if (errorRate > 5) score -= 30;
  if (responseTime > 1000) score -= 15;

  // Determine status
  if (score >= 90) {
    status = 'excellent';
    description = 'All systems operating optimally';
  } else if (score >= 70) {
    status = 'good';
    description = 'Systems operating normally with minor issues';
  } else if (score >= 50) {
    status = 'warning';
    description = 'Some systems require attention';
  } else {
    status = 'critical';
    description = 'Critical issues require immediate attention';
  }

  return {
    score: Math.max(0, score),
    status,
    description,
    progress: Math.max(0, score)
  };
};

/**
 * Process key metrics
 * @param {Object} data - Latest metrics data
 * @returns {Object} Key metrics information
 */
const processKeyMetrics = (data) => {
  return {
    memoryUsage: {
      current: Math.round(data.memoryUsage || 240),
      total: 305,
      unit: 'MB',
      percentage: Math.round((data.memoryUsage || 240) / 305 * 100)
    },
    activeConnections: {
      current: data.activeConnections || 0,
      total: 1000,
      percentage: Math.round((data.activeConnections || 0) / 10)
    },
    operationsTracked: {
      count: data.operationsTracked || 0,
      status: 'optimal'
    },
    totalOperations: {
      count: data.totalOperations || 0,
      trend: 'stable'
    },
    alerts: {
      count: data.alerts || 0,
      severity: 'low'
    },
    uptime: {
      percentage: data.uptime || 100,
      duration: '30 days'
    }
  };
};

/**
 * Process performance metrics for table display
 * @param {Array} docs - Firestore document snapshots
 * @returns {Array} Performance metrics table data
 */
const processPerformanceTable = (docs) => {
  // Group by operation type
  const operationGroups = {};
  
  docs.forEach(doc => {
    const data = doc.data();
    const operations = data.operations || [];
    
    operations.forEach(op => {
      if (!operationGroups[op.name]) {
        operationGroups[op.name] = {
          operation: op.name,
          totalCalls: 0,
          successCount: 0,
          errorCount: 0,
          totalDuration: 0,
          health: 'excellent'
        };
      }
      
      const group = operationGroups[op.name];
      group.totalCalls += op.calls || 0;
      group.successCount += op.successes || 0;
      group.errorCount += op.errors || 0;
      group.totalDuration += op.duration || 0;
    });
  });

  // Convert to array and calculate derived metrics
  return Object.values(operationGroups).map(group => {
    const successRate = group.totalCalls > 0 
      ? Math.round((group.successCount / group.totalCalls) * 100)
      : 100;
    
    const avgDuration = group.totalCalls > 0
      ? Math.round(group.totalDuration / group.totalCalls)
      : 0;

    // Determine health based on success rate and response time
    let health = 'excellent';
    if (successRate < 95 || avgDuration > 500) health = 'warning';
    if (successRate < 90 || avgDuration > 1000) health = 'critical';

    return {
      ...group,
      successRate,
      avgDuration,
      trend: 'stable' // Could be calculated based on historical data
    };
  });
};

/**
 * Generate insights and recommendations
 * @param {Array} docs - Firestore document snapshots
 * @param {string} timeRange - Time range filter
 * @returns {Object} Insights data
 */
const generateInsights = (docs, timeRange) => {
  const recommendations = [];
  const trends = {
    cpu: 'stable',
    memory: 'stable',
    network: 'stable'
  };

  if (docs.length === 0) {
    return {
      recommendations: [
        'System performance is optimal',
        'No immediate actions required'
      ],
      trends
    };
  }

  const latest = docs[0].data();
  const previous = docs.length > 1 ? docs[1].data() : null;

  // Generate recommendations based on data
  if (latest.cpuUsage > 80) {
    recommendations.push('High CPU usage detected - consider scaling up');
  }
  
  if (latest.memoryUsage > 85) {
    recommendations.push('Memory usage is high - consider optimizing memory usage');
  }
  
  if (latest.errorRate > 5) {
    recommendations.push('High error rate detected - investigate application logs');
  }

  if (recommendations.length === 0) {
    recommendations.push('System performance is optimal');
    recommendations.push('No immediate actions required');
  }

  // Calculate trends
  if (previous) {
    trends.cpu = latest.cpuUsage > previous.cpuUsage ? 'increasing' : 
                 latest.cpuUsage < previous.cpuUsage ? 'decreasing' : 'stable';
    
    trends.memory = latest.memoryUsage > previous.memoryUsage ? 'increasing' : 
                    latest.memoryUsage < previous.memoryUsage ? 'decreasing' : 'stable';
  }

  return {
    recommendations,
    trends
  };
};

/**
 * Get default metrics when no data is available
 * @returns {Object} Default performance metrics
 */
const getDefaultMetrics = () => ({
  systemHealth: {
    score: 100,
    status: 'excellent',
    description: 'All systems operating optimally',
    progress: 100
  },
  keyMetrics: {
    memoryUsage: {
      current: 240,
      total: 305,
      unit: 'MB',
      percentage: 79
    },
    activeConnections: {
      current: 0,
      total: 1000,
      percentage: 6
    },
    operationsTracked: {
      count: 0,
      status: 'optimal'
    },
    totalOperations: {
      count: 0,
      trend: 'stable'
    },
    alerts: {
      count: 0,
      severity: 'low'
    },
    uptime: {
      percentage: 100,
      duration: '30 days'
    }
  },
  performanceMetrics: [],
  insights: {
    recommendations: [
      'System performance is optimal',
      'No immediate actions required'
    ],
    trends: {
      cpu: 'stable',
      memory: 'stable',
      network: 'stable'
    }
  },
  lastUpdated: new Date().toISOString()
});

/**
 * Export performance metrics to CSV
 * @param {string} timeRange - Time range filter
 * @returns {Promise<string>} CSV data
 */
export const exportPerformanceMetrics = async (timeRange = '1h') => {
  try {
    const metrics = await getPerformanceMetrics(timeRange);
    
    // Convert to CSV format
    const headers = ['Operation', 'Health', 'Total Calls', 'Success Rate', 'Avg Duration', 'Trend'];
    const rows = metrics.performanceMetrics.map(metric => [
      metric.operation,
      metric.health,
      metric.totalCalls,
      `${metric.successRate}%`,
      `${metric.avgDuration}ms`,
      metric.trend
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;

  } catch (error) {
    logger.error('Failed to export performance metrics:', error);
    throw error;
  }
};

// Export the service object
export const performanceService = {
  getPerformanceMetrics,
  subscribeToPerformanceMetrics,
  exportPerformanceMetrics
};
