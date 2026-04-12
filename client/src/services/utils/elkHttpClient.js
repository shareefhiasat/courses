/**
 * ELK HTTP Client for Browser
 * 
 * Sends logs to Elasticsearch via HTTP API
 * Browser-compatible alternative to winston-elasticsearch
 */

// Browser-compatible environment variables
const getEnvVar = (name, defaultValue) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name] || defaultValue;
  }
  return defaultValue;
};

class ELKHttpClient {
  constructor() {
    this.enabled = getEnvVar('ELK_ENABLED') === 'true';
    this.isProduction = getEnvVar('NODE_ENV') === 'production';
    this.index = getEnvVar('ELASTICSEARCH_INDEX', 'lms-logs');
    this.url = getEnvVar('ELASTICSEARCH_URL', 'http://localhost:9200');
    this.username = getEnvVar('ELASTICSEARCH_USER');
    this.password = getEnvVar('ELASTICSEARCH_PASSWORD');
    this.maxRetries = parseInt(getEnvVar('ELK_MAX_RETRIES', '3'));
    this.batchSize = parseInt(getEnvVar('ELK_BATCH_SIZE', '10'));
    this.flushInterval = parseInt(getEnvVar('ELK_FLUSH_INTERVAL', '5000'));
    
    this.logBuffer = [];
    this.flushTimer = null;
    
    if (this.enabled && this.isProduction) {
      this.startFlushTimer();
    }
  }

  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  async sendLog(logEntry) {
    if (!this.enabled || !this.isProduction) {
      return false;
    }

    // Add to buffer for batch sending
    this.logBuffer.push({
      ...logEntry,
      '@timestamp': new Date().toISOString(),
      service: 'lms-client',
      environment: getEnvVar('NODE_ENV', 'development')
    });

    // Flush immediately if buffer is full
    if (this.logBuffer.length >= this.batchSize) {
      await this.flush();
    }

    return true;
  }

  async flush() {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.sendToElasticsearch(logsToSend);
    } catch (error) {
      console.error('Failed to send logs to ELK:', error);
      // Re-add failed logs to buffer for retry
      this.logBuffer.unshift(...logsToSend);
    }
  }

  async sendToElasticsearch(logs) {
    const url = `${this.url}/${this.index}/_bulk`;
    
    // Prepare bulk format for Elasticsearch
    const bulkBody = logs.flatMap(log => [
      { index: { _index: this.index } },
      log
    ]);

    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authentication if configured
    if (this.username && this.password) {
      const auth = btoa(`${this.username}:${this.password}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bulkBody.join('\n') + '\n'),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.warn('Some logs failed to index:', result);
    }

    return result;
  }

  // Graceful shutdown
  shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    return this.flush();
  }
}

// Create singleton instance
const elkClient = new ELKHttpClient();

// Export for use in logger
export default elkClient;
