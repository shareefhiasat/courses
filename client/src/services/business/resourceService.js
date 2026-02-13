import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from '../other/config';
import { getUserById } from './userService';
import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { convertDatesToTimestamps, COMMON_DATE_FIELDS } from '@utils/date.js';
import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';

// Get all resources
export const getResources = async () => {
  try {
    logger.info('RESOURCE: Fetching all resources');
    
    const querySnapshot = await getDocs(collection(db, "resources"));
    const resources = [];
    querySnapshot.forEach((d) => {
      const resourceData = { docId: d.id, ...d.data() };
      resources.push(resourceData);
    });
    
    logger.info('RESOURCE: Successfully fetched resources', { count: resources.length });
    return { success: true, data: resources };
  } catch (error) {
    logger.error('RESOURCE: Failed to fetch resources', { error: error.message });
    console.error("Error getting all resources:", error);
    return { success: false, error: error.message };
  }
};

// Get resources by class ID
export const getResourcesByClass = async (classId) => {
  try {
    const q = query(collection(db, "resources"), where("classId", "==", classId));
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach((d) => {
      const resourceData = { docId: d.id, ...d.data() };
      resources.push(resourceData);
    });
    return { success: true, data: resources };
  } catch (error) {
    console.error("Error getting resources by class:", error);
    return { success: false, error: error.message };
  }
};

// Add a new resource
export const addResource = async (resourceData) => {
  try {
    logger.info('RESOURCE: Creating new resource', {
      title: resourceData.title_en || resourceData.title,
      url: resourceData.url,
      type: resourceData.type,
      hasClassId: !!resourceData.classId,
      hasProgramId: !!resourceData.programId,
      hasSubjectId: !!resourceData.subjectId
    });
    
    const convertedData = convertDatesToTimestamps(resourceData, COMMON_DATE_FIELDS.resources || ['dueDate'], Timestamp);
    const docRef = await addDoc(collection(db, "resources"), {
      ...convertedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.RESOURCE_CREATED, {
        resourceId: docRef.id,
        title: resourceData.title_en || resourceData.title,
        classId: resourceData.classId
      });
    } catch (logError) {
      logger.warn('RESOURCE: Failed to log resource creation:', logError);
    }

    // Send notifications for new resource
    if (resourceData.classId) {
      try {
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', resourceData.classId)));
        const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
        
        for (const studentId of studentIds) {
          const { data: student } = await getUserById(studentId);
          if (student && student.email) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.RESOURCE_NEW, {
              userId: studentId,
              role: 'student',
              classId: resourceData.classId,
              title: 'New Resource Available',
              message: `A new resource "${resourceData.title_en || resourceData.title}" has been uploaded to your class.`,
              email: student.email,
              resourceId: docRef.id,
              url: resourceData.url,
              variables: {
                resourceTitle: resourceData.title_en || resourceData.title,
                resourceUrl: resourceData.url,
                resourceDescription: resourceData.description_en || resourceData.description,
                classId: resourceData.classId
              }
            });
          }
        }
      } catch (notificationError) {
        console.warn('Failed to send notifications for new resource:', notificationError);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding resource:", error);
    return { success: false, error: error.message };
  }
};

// Update a resource
export const updateResource = async (id, resourceData, emailOptions = { sendEmail: true }) => {
  try {
    if (!id) {
      throw new Error('Resource ID is required for update');
    }
    
    const convertedData = convertDatesToTimestamps(resourceData, COMMON_DATE_FIELDS.resources || ['dueDate'], Timestamp);
    await updateDoc(doc(db, "resources", id), {
      ...convertedData,
      updatedAt: serverTimestamp()
    });

    // Send notifications for updated resource only if email is enabled
    if (resourceData.classId && emailOptions.sendEmail) {
      try {
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', resourceData.classId)));
        const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
        
        for (const studentId of studentIds) {
          const { data: student } = await getUserById(studentId);
          if (student && student.email) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.RESOURCE_UPDATED, {
              userId: studentId,
              role: 'student',
              classId: resourceData.classId,
              title: 'Resource Updated',
              message: `Resource "${resourceData.title_en || resourceData.title}" has been updated.`,
              email: student.email,
              resourceId: id,
              url: resourceData.url,
              variables: {
                resourceTitle: resourceData.title_en || resourceData.title,
                resourceUrl: resourceData.url,
                resourceDescription: resourceData.description_en || resourceData.description,
                classId: resourceData.classId
              }
            });
          }
        }
      } catch (notificationError) {
        console.warn('Failed to send notifications for resource update:', notificationError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating resource:", error);
    return { success: false, error: error.message };
  }
};

// Delete a resource
export const deleteResource = async (id) => {
  try {
    await deleteDoc(doc(db, "resources", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting resource:", error);
    return { success: false, error: error.message };
  }
};

// Get resource by ID
export const getResourceById = async (id) => {
  try {
    const docRef = doc(db, "resources", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Resource not found' };
    }
  } catch (error) {
    console.error("Error getting resource by ID:", error);
    return { success: false, error: error.message };
  }
};
