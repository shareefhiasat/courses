// Mock implementation since no submission DB service exists
export const getUserSubmissions = async (userId, options = {}) => {
  try {
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
  getUserSubmissions,
};
