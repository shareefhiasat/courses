import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./config";
import { logActivity, ACTIVITY_LOG_TYPES } from './activityLogger';

/**
 * Announcement Service
 * Handles all Firebase operations for announcements
 * Extracted from activityService.js for better modularity
 */

/**
 * Get all announcements ordered by creation date
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAnnouncements = async () => {
  try {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const announcements = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      announcements.push({
        docId: d.id,
        id: d.id,
        ...data,
        // Keep Firestore timestamp as-is for Qatar date utilities to handle properly
        createdAt: data.createdAt
      });
    });
    return { success: true, data: announcements };
  } catch (error) {
    console.error("Error getting announcements:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a new announcement
 * @param {Object} announcementData - Announcement data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const addAnnouncement = async (announcementData) => {
  try {
    const docRef = await addDoc(collection(db, "announcements"), {
      ...announcementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log announcement creation (non-blocking)
    try {
      await logActivity(ACTIVITY_LOG_TYPES.ANNOUNCEMENT_CREATED, {
        announcementId: docRef.id,
        announcementTitle: announcementData.title,
        target: announcementData.target,
        programId: announcementData.programId,
        subjectId: announcementData.subjectId,
        classId: announcementData.classId
      });
    } catch (logError) {
      console.warn('Failed to log announcement creation:', logError);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding announcement:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing announcement
 * @param {string} id - Announcement document ID
 * @param {Object} announcementData - Updated announcement data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAnnouncement = async (id, announcementData) => {
  try {
    await updateDoc(doc(db, "announcements", id), {
      ...announcementData,
      updatedAt: serverTimestamp()
    });

    // Log announcement update
    try {
      await logActivity(ACTIVITY_LOG_TYPES.ANNOUNCEMENT_UPDATED, {
        announcementId: id,
        announcementTitle: announcementData.title
      });
    } catch (logError) {
      console.warn('Failed to log announcement update:', logError);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete an announcement
 * @param {string} id - Announcement document ID
 * @param {Object} announcementData - Announcement data for logging (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAnnouncement = async (id, announcementData = null) => {
  try {
    await deleteDoc(doc(db, "announcements", id));

    // Log announcement deletion
    if (announcementData) {
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ANNOUNCEMENT_DELETED, {
          announcementId: id,
          announcementTitle: announcementData.title
        });
      } catch (logError) {
        console.warn('Failed to log announcement deletion:', logError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: error.message };
  }
};
