// Mock implementation since quiz DB service has incompatible exports
export const getAllQuizzes = async (options = {}) => {
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
  getAllQuizzes,
};
