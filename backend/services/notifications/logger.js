/**
 * Logger wrapper for notification services
 * 
 * This provides a consistent logging interface for the notification gateway.
 * It wraps the existing backend logger utility.
 */

import { info, error, warn, debug } from '../../utils/common/logger.js';

const serviceName = 'notificationGateway';

export const log = {
  info: (message, data) => info(`${serviceName}: ${message}`, data),
  error: (message, data) => error(`${serviceName}: ${message}`, data),
  warn: (message, data) => warn(`${serviceName}: ${message}`, data),
  debug: (message, data) => debug(`${serviceName}: ${message}`, data)
};

export default log;
