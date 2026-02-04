import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";
import { logActivity, ACTIVITY_TYPES } from './activityLogger';

// Helper: Convert ISO string to Firestore Timestamp
const convertDatesToTimestamps = (data) => {
  const converted = { ...data };
  if (converted.dueDate && typeof converted.dueDate === "string") {
    const date = new Date(converted.dueDate);
    if (!isNaN(date.getTime())) {
      converted.dueDate = Timestamp.fromDate(date);
    }
  }
  return converted;
};

// Activities
export const getActivities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "activities"));
    const activities = [];
    querySnapshot.forEach((d) => {
      const activityData = { docId: d.id, ...d.data() };
      if (activityData.createdAt?.toDate) {
        activityData.createdAt = activityData.createdAt.toDate();
      }
      activities.push(activityData);
    });
    return { success: true, data: activities };
  } catch (error) {
    console.error("Error getting activities:", error);
    return { success: false, error: error.message };
  }
};

export const addActivity = async (activityData) => {
  try {
    const convertedData = convertDatesToTimestamps(activityData);
    const docRef = await addDoc(collection(db, "activities"), {
      ...convertedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding activity:", error);
    return { success: false, error: error.message };
  }
};

export const updateActivity = async (id, activityData) => {
  try {
    const convertedData = convertDatesToTimestamps(activityData);
    await updateDoc(doc(db, "activities", id), {
      ...convertedData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating activity:", error);
    return { success: false, error: error.message };
  }
};

export const deleteActivity = async (id) => {
  try {
    await deleteDoc(doc(db, "activities", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting activity:", error);
    return { success: false, error: error.message };
  }
};

// Announcements
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
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate()
      });
    });
    return { success: true, data: announcements };
  } catch (error) {
    console.error("Error getting announcements:", error);
    return { success: false, error: error.message };
  }
};

export const addAnnouncement = async (announcementData) => {
  try {
    const docRef = await addDoc(collection(db, "announcements"), {
      ...announcementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding announcement:", error);
    return { success: false, error: error.message };
  }
};

export const updateAnnouncement = async (id, announcementData) => {
  try {
    await updateDoc(doc(db, "announcements", id), announcementData);
    return { success: true };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: error.message };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    await deleteDoc(doc(db, "announcements", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: error.message };
  }
};

// Resources
export const getResources = async () => {
  try {
    const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      resources.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });
    return { success: true, data: resources };
  } catch (error) {
    console.error("Error getting resources:", error);
    return { success: false, error: error.message };
  }
};

export const addResource = async (resourceData) => {
  try {
    const convertedData = convertDatesToTimestamps(resourceData);
    const docRef = await addDoc(collection(db, "resources"), {
      ...convertedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding resource:", error);
    return { success: false, error: error.message };
  }
};

export const updateResource = async (id, resourceData) => {
  try {
    const convertedData = convertDatesToTimestamps(resourceData);
    await updateDoc(doc(db, "resources", id), {
      ...convertedData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating resource:", error);
    return { success: false, error: error.message };
  }
};

export const deleteResource = async (id) => {
  try {
    await deleteDoc(doc(db, "resources", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting resource:", error);
    return { success: false, error: error.message };
  }
};

// ===== ACTIVITY LOGS (Re-exports from activityLogger) =====

// Re-export activity logging functions from activityLogger for unified access
export { logActivity, ACTIVITY_TYPES };

// Legacy compatibility functions
export const addActivityLog = async (log = {}) => {
  return logActivity(log.type, log.metadata || {}, log.userId);
};

export const addLoginLog = async (log = {}) => {
  return logActivity(ACTIVITY_TYPES.LOGIN, log.metadata || {}, log.userId);
};

export const getLoginLogs = async () => {
  try {
    const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    console.error("Error getting login logs:", error);
    return { success: false, error: error.message };
  }
};
