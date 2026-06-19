// Mock implementation since no submissions DB service exists
import { getUserSubmissions } from './submissionService.js';

export const getSubmissionsByUser = getUserSubmissions;

export const getSubmissions = async (options = {}) => {
  try {
    if (options.userId) {
      return getSubmissionsByUser(options.userId, options);
    }
    return {
      success: true,
      data: [],
      total: 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

export default {
  getSubmissions,
  getSubmissionsByUser,
};
