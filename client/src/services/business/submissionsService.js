// Mock implementation since no submissions DB service exists
export const getSubmissions = async (options = {}) => {
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
  getSubmissions,
};
