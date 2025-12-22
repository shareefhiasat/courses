import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

// ===== Notifications =====
// Model: collection "notifications" documents { userId, title, message, type, read, createdAt, data? }

export const getNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addNotification = async (notification) => {
  try {
    const notificationData = {
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info', // system, class, quiz, attendance, activity, info
      classId: notification.classId || null,
      metadata: notification.metadata || {},
      deliveryStatus: 'sent', // sent, failed, pending
      read: false,
      readAt: null,
      createdAt: serverTimestamp()
    };
    
    // Preserve existing data field if provided
    if (notification.data) {
      notificationData.data = notification.data;
    }
    
    const ref = await addDoc(collection(db, 'notifications'), notificationData);
    
    // Also log to notificationLogs for analytics
    try {
      await addDoc(collection(db, 'notificationLogs'), {
        ...notificationData,
        notificationId: ref.id,
        timestamp: serverTimestamp()
      });
    } catch (logError) {
      console.warn('Failed to log notification to notificationLogs:', logError);
    }
    
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const qs = await getDocs(q);
    const updates = [];
    qs.forEach(d => {
      updates.push(updateDoc(doc(db, 'notifications', d.id), { read: true }));
    });
    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time notifications listener
export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    callback(notifications);
  });
};

// Bulk notification helpers
export const notifyAllUsers = async (title, message, type = 'info', data = null) => {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const notifications = [];
    
    usersSnapshot.forEach(userDoc => {
      notifications.push(addNotification({
        userId: userDoc.id,
        title,
        message,
        type,
        data
      }));
    });
    
    await Promise.all(notifications);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const notifyUsersByClass = async (classId, title, message, type = 'info', data = null) => {
  try {
    // Get enrollments for this class
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('classId', '==', classId)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const notifications = [];
    
    enrollmentsSnapshot.forEach(enrollmentDoc => {
      const enrollment = enrollmentDoc.data();
      notifications.push(addNotification({
        userId: enrollment.userId,
        title,
        message,
        type,
        data: { ...data, classId }
      }));
    });
    
    await Promise.all(notifications);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
