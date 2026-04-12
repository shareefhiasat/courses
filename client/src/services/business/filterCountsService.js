// Mock implementation since no filterCounts DB service exists
export const getFilterCounts = async (filters = {}) => {
  try {
    return {
      success: true,
      data: {
        activities: 0,
        announcements: 0,
        resources: 0,
        quizzes: 0,
        submissions: 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

export default {
  getFilterCounts,
};
