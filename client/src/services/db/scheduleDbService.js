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
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get all classes with schedules for a specific term and year
 * @param {string} term - Term (e.g., 'Fall', 'Spring', 'Summer')
 * @param {string} year - Year (e.g., '2024')
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSchedulesByTermAndYear = async (term, year) => {
  try {
    // Get all classes first, then filter client-side for multiple where conditions
    const result = await dbService.getAll(COLLECTIONS.CLASSES);
    
    if (result.success) {
      const schedules = result.data
        .filter(cls => cls.term === term && cls.year === year)
        .filter(cls => cls.schedule && cls.schedule.days && cls.schedule.days.length > 0);
      
      return { success: true, data: schedules };
    }
    
    // Handle missing collection gracefully
    if (!result.success && result.error && 
        (result.error.includes('Missing or insufficient permissions') || 
         result.error.includes('permission-denied') ||
         result.error.includes('No document to update'))) {
      logger.warn('[ScheduleDbService] Classes collection not available:', { error: result.error });
      return {
        success: true,
        data: []
      };
    }
    
    return result;
  } catch (error) {
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
    const querySnapshot = await getDocs(collection(dbService.getDb(), COLLECTIONS.CLASSES));
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
      q = query(
        collection(dbService.getDb(), COLLECTIONS.CLASSES),
        where('programId', '==', programId),
        where('term', '==', term),
        where('year', '==', year)
      );
    } else {
      q = query(
        collection(dbService.getDb(), COLLECTIONS.CLASSES),
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
      q = query(
        collection(dbService.getDb(), COLLECTIONS.CLASSES),
        where('ownerEmail', '==', instructorEmail),
        where('term', '==', term),
        where('year', '==', year)
      );
    } else {
      q = query(
        collection(dbService.getDb(), COLLECTIONS.CLASSES),
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
