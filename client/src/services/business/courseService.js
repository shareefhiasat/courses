import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { handleServiceError, withRetry } from '@utils/errorHandling';
import { validateEntity } from '@utils/validationHelpers';
import { 
  getCourses as getCoursesFromDb,
  getCourse as getCourseFromDb,
  create as createCourseToDb,
  update as updateCourseInDb,
  setCourse as setCourseToDb,
  deleteCourse as deleteCourseFromDb,
  getActiveCourses as getActiveCoursesFromDb,
  searchCourses as searchCoursesFromDb
} from '../db/courseDbService';

/**
 * Course Service
 * Handles course/program management with proper business logic
 */

const COURSE_VALIDATION_RULES = [
  { field: 'name', required: true, type: 'string', label: 'Course name' },
  { field: 'description', type: 'string', label: 'Course description' },
  { field: 'duration', type: 'number', positive: true, label: 'Course duration' }
];
const validateCourseData = (data) => validateEntity(data, COURSE_VALIDATION_RULES);

// Get all courses - with performance monitoring and memoization
export const getCourses = async () => {
  try {
    logger.info('COURSE: Fetching all courses');
    
    const result = await getCoursesFromDb();
    
    if (result.success) {
      logger.info('COURSE: Successfully fetched courses', { count: result.data.length });
    } else {
      logger.warn('COURSE: Failed to fetch courses', { error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('COURSE: Failed to fetch courses', { error: error.message });
    return handleServiceError(error, { operation: 'getCourses' });
  }
};

// Set/update course with validation
export const setCourse = async (courseId, data, user) => {
  try {
    logger.info('COURSE: Setting course', { courseId });
    
    // Validate input data
    const validationErrors = validateCourseData(data);
    if (validationErrors.length > 0) {
      logger.warn('COURSE: Validation failed', { errors: validationErrors });
      return { success: false, error: validationErrors.join(', ') };
    }
    
    const result = await setCourseToDb(courseId, data, user);
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.COURSE_UPDATED, {
        courseId,
        courseName: data.name
      });
    } catch (logError) {
      logger.warn('COURSE: Failed to log course update:', logError);
    }
    
    logger.info('COURSE: Successfully set course', { courseId });
    return result;
  } catch (error) {
    logger.error('COURSE: Failed to set course', { error: error.message, courseId });
    return { success: false, error: error.message };
  }
};

// Delete course with proper cleanup
export const deleteCourse = async (courseId) => {
  try {
    logger.info('COURSE: Deleting course', { courseId });
    
    if (!courseId) {
      return { success: false, error: 'Course ID is required' };
    }
    
    // Check if course exists
    const courseResult = await getCourseById(courseId);
    if (!courseResult.success) {
      logger.warn('COURSE: Course not found for deletion', { courseId });
      return { success: false, error: 'Course not found' };
    }
    
    // TODO: Add cascade deletion for related data (classes, enrollments, etc.)
    // For now, just delete the course
    
    // Use database layer instead of direct Firestore
    const result = await deleteCourseFromDb(courseId);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.COURSE_DELETED, {
          courseId,
          courseName: courseResult.data.name
        });
      } catch (logError) {
        logger.warn('COURSE: Failed to log course deletion:', logError);
      }
      
      logger.info('COURSE: Successfully deleted course', { courseId });
    }
    
    return result;
  } catch (error) {
    logger.error('COURSE: Failed to delete course', { error: error.message, courseId });
    return { success: false, error: error.message };
  }
};

// Get course by ID with proper error handling
export const getCourseById = async (courseId) => {
  try {
    if (!courseId) {
      return { success: false, error: 'Course ID is required' };
    }
    
    logger.info('COURSE: Fetching course by ID', { courseId });
    
    const result = await getCourseFromDb(courseId);
    
    if (result.success) {
      logger.info('COURSE: Successfully fetched course', { courseId });
    } else {
      logger.warn('COURSE: Course not found', { courseId });
    }
    
    return result;
  } catch (error) {
    logger.error('COURSE: Failed to fetch course', { error: error.message, courseId });
    return { success: false, error: error.message };
  }
};

// Create new course
export const createCourse = async (courseData, user) => {
  try {
    logger.info('COURSE: Creating new course', { name: courseData.name });
    
    // Validate input data
    const validationErrors = validateCourseData(courseData);
    if (validationErrors.length > 0) {
      logger.warn('COURSE: Validation failed', { errors: validationErrors });
      return { success: false, error: validationErrors.join(', ') };
    }
    
    const newCourseData = {
      ...courseData,
      isActive: true
    };
    
    const result = await createCourseToDb(newCourseData, user);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.COURSE_CREATED, {
          courseId: result.id,
          courseName: courseData.name
        });
      } catch (logError) {
        logger.warn('COURSE: Failed to log course creation:', logError);
      }
      
      logger.info('COURSE: Successfully created course', { courseId: result.id });
    }
    
    return result;
  } catch (error) {
    logger.error('COURSE: Failed to create course', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Update course
export const updateCourse = async (courseId, updateData, user) => {
  try {
    logger.info('COURSE: Updating course', { courseId });
    
    if (!courseId) {
      return { success: false, error: 'Course ID is required' };
    }
    
    // Validate input data
    const validationErrors = validateCourseData(updateData);
    if (validationErrors.length > 0) {
      logger.warn('COURSE: Validation failed', { errors: validationErrors });
      return { success: false, error: validationErrors.join(', ') };
    }
    
    const result = await updateCourseInDb(courseId, updateData, user);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.COURSE_UPDATED, {
          courseId,
          courseName: updateData.name
        });
      } catch (logError) {
        logger.warn('COURSE: Failed to log course update:', logError);
      }
      
      logger.info('COURSE: Successfully updated course', { courseId });
    }
    
    return result;
  } catch (error) {
    logger.error('COURSE: Failed to update course', { error: error.message, courseId });
    return { success: false, error: error.message };
  }
};

// Get active courses only
export const getActiveCourses = async () => {
  try {
    logger.info('COURSE: Fetching active courses');
    
    const result = await getActiveCoursesFromDb();
    
    if (result.success) {
      logger.info('COURSE: Successfully fetched active courses', { count: result.data.length });
    }
    
    return result;
  } catch (error) {
    logger.error('COURSE: Failed to fetch active courses', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Search courses
export const searchCourses = async (searchTerm) => {
  try {
    logger.info('COURSE: Searching courses', { searchTerm });
    
    const result = await searchCoursesFromDb(searchTerm);
    
    if (result.success) {
      logger.info('COURSE: Successfully searched courses', { count: result.data.length });
    }
    
    return result;
  } catch (error) {
    logger.error('COURSE: Failed to search courses', { error: error.message });
    return { success: false, error: error.message };
  }
};

