import { info, error as logError } from '@services/utils/logger.js';

const serviceName = 'templatesService';

export const uploadDefaultTemplates = async () => {
  try {
    info(`${serviceName}:uploadDefaultTemplates`, {});
    
    return {
      success: true,
      message: 'Templates feature temporarily disabled - Phase 2',
      data: null
    };
  } catch (err) {
    logError(`${serviceName}:uploadDefaultTemplates error:`, err);
    return {
      success: false,
      error: err.message,
      data: null
    };
  }
};

export default {
  uploadDefaultTemplates,
};
