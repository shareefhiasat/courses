// Mock implementation since no course DB service exists
export const getCourses = async (options = {}) => {
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
  getCourses,
};
