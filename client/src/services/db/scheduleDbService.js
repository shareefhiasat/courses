/**
 * Schedule Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for schedule records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'classes' (schedules are stored within class documents)
 * 
 * @typedef {import('@types/index').Schedule} Schedule
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get all classes with schedules for a specific term and year
 * @param {string} term - Term (e.g., 'Fall', 'Spring', 'Summer')
 * @param {string} year - Year (e.g., '2024')
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSchedulesByTermAndYear = async (term, year) => {
  try {
    const termString = `${term} ${year}`;
    const q = query(
      collection(db, 'classes'), 
      where('term', '==', termString)
    );
    
    const querySnapshot = await getDocs(q);
    const schedules = querySnapshot.docs
      .map(doc => ({ docId: doc.id, ...doc.data() }))
      .filter(cls => cls.schedule && cls.schedule.days && cls.schedule.days.length > 0);
    
    return { success: true, data: schedules };
  } catch (error) {
    // Check if this is a missing collection error
    if (error.message.includes('Missing or insufficient permissions') || 
        error.code === 'permission-denied' ||
        error.message.includes('No document to update')) {
      logger.warn('[ScheduleDbService] Classes collection not available:', { error: error.message });
      return {
        success: true,
        data: []
      };
    }
    
    logger.error('[ScheduleDbService] Error getting schedules by term and year:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all classes with schedules (no filtering)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAllSchedules = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'classes'));
    const schedules = querySnapshot.docs
      .map(doc => ({ docId: doc.id, ...doc.data() }))
      .filter(cls => cls.schedule && cls.schedule.days && cls.schedule.days.length > 0);
    
    return { success: true, data: schedules };
  } catch (error) {
    logger.error('[ScheduleDbService] Error getting all schedules:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedules by program
 * @param {string} programId - Program ID
 * @param {string} term - Term (optional)
 * @param {string} year - Year (optional)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSchedulesByProgram = async (programId, term = null, year = null) => {
  try {
    let q;
    if (term && year) {
      const termString = `${term} ${year}`;
      q = query(
        collection(db, 'classes'),
        where('programId', '==', programId),
        where('term', '==', termString)
      );
    } else {
      q = query(
        collection(db, 'classes'),
        where('programId', '==', programId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const schedules = querySnapshot.docs
      .map(doc => ({ docId: doc.id, ...doc.data() }))
      .filter(cls => cls.schedule && cls.schedule.days && cls.schedule.days.length > 0);
    
    return { success: true, data: schedules };
  } catch (error) {
    logger.error('[ScheduleDbService] Error getting schedules by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get schedules by instructor
 * @param {string} instructorEmail - Instructor email
 * @param {string} term - Term (optional)
 * @param {string} year - Year (optional)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSchedulesByInstructor = async (instructorEmail, term = null, year = null) => {
  try {
    let q;
    if (term && year) {
      const termString = `${term} ${year}`;
      q = query(
        collection(db, 'classes'),
        where('ownerEmail', '==', instructorEmail),
        where('term', '==', termString)
      );
    } else {
      q = query(
        collection(db, 'classes'),
        where('ownerEmail', '==', instructorEmail)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const schedules = querySnapshot.docs
      .map(doc => ({ docId: doc.id, ...doc.data() }))
      .filter(cls => cls.schedule && cls.schedule.days && cls.schedule.days.length > 0);
    
    return { success: true, data: schedules };
  } catch (error) {
    logger.error('[ScheduleDbService] Error getting schedules by instructor:', error);
    return { success: false, error: error.message };
  }
};
