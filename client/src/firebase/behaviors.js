import { doc, deleteDoc, collection, addDoc, serverTimestamp, updateDoc, setDoc, getDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './config';
import { addNotification } from './notifications';
import { sendEmail } from './firestore';

/**
 * Create a behavior record
 * @param {Object} params
 * @param {string} params.classId - Class ID
 * @param {string} params.studentId - Student user ID
 * @param {string} params.date - Date string (YYYY-MM-DD)
 * @param {number} params.delta - Behavior points (negative for behavior issues)
 * @param {string} params.behaviorType - Type of behavior
 * @param {string} params.createdBy - User ID who created the record
 * @param {string} params.notes - Optional notes
 * @param {Object} params.studentInfo - Optional { email, displayName } for notifications
 * @param {string} params.className - Optional class name for notifications
 * @param {boolean} params.sendNotification - Whether to send notification (default: true)
 */
export async function createBehavior({
  classId,
  studentId,
  date,
  delta,
  behaviorType,
  createdBy,
  notes = '',
  studentInfo = null,
  className = '',
  sendNotification = true
}) {
  try {
    const behavior = {
      classId,
      studentId,
      date,
      delta,
      behaviorType,
      notes,
      markedBy: createdBy,
      createdBy: createdBy, // User tracking compliance
      method: 'manual',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "behaviors"), behavior);

    // Send notification to student if requested
    if (sendNotification && studentId) {
      try {
        const formattedDate = new Date(date).toLocaleDateString('en-GB');
        
        // In-app notification
        await addNotification({
          userId: studentId,
          title: '⚠️ Behavior Recorded',
          message: `Behavior recorded for ${className || 'class'} on ${formattedDate}${notes ? ` - ${notes}` : ''}`,
          type: 'behavior',
          classId: classId,
          metadata: {
            date,
            delta,
            behaviorType,
            className: className,
            method: 'manual'
          },
          data: { 
            classId, 
            date, 
            delta,
            behaviorType
          }
        });

        // Email notification for significant behavior issues
        if (studentInfo?.email && Math.abs(delta) >= 2) {
          try {
            await sendEmail({
              to: studentInfo.email,
              template: 'behaviorNotification',
              type: 'behavior',
              classId: classId,
              data: {
                studentName: studentInfo.displayName || studentInfo.email,
                className: className || 'Class',
                date: formattedDate,
                behaviorType: behaviorType,
                delta: delta,
                notes: notes || ''
              },
              metadata: {
                classId,
                className,
                date,
                behaviorType,
                delta
              }
            });
          } catch (emailError) {
            console.warn('Failed to send behavior email:', emailError);
          }
        }
      } catch (notifyError) {
        console.warn('Failed to send behavior notification:', notifyError);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating behavior record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a behavior record
 * @param {string} behaviorId - Behavior record ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.updatedBy - User ID who updated the record
 */
export async function updateBehavior(behaviorId, { updatedBy, ...updateData }) {
  try {
    const docRef = doc(db, 'behaviors', behaviorId);
    
    // Get existing document to preserve history
    const existingDoc = await getDoc(docRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : {};
    const existingHistory = existingData.history || [];
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
      updatedBy,
      // Track update history
      history: [...existingHistory, {
        changedBy: updatedBy,
        changedAt: new Date().toISOString(),
        changes: Object.keys(updateData)
      }]
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating behavior record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a behavior record
 */
export async function deleteBehavior(behaviorId) {
  try {
    if (!behaviorId) {
      return { success: false, error: 'Behavior ID is required' };
    }
    
    await deleteDoc(doc(db, 'behaviors', behaviorId));
    console.log('[Behavior] Deleted behavior record:', behaviorId);
    
    return { success: true };
  } catch (error) {
    console.error('[Behavior] Error deleting behavior record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get behaviors by class and date
 * @param {string} classId - Class ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getBehaviorsByClassAndDate = async (classId, date) => {
  try {
    const behaviorsRef = collection(db, "behaviors");
    // Get all behaviors ordered by createdAt (no where clause to avoid index requirement)
    const behaviorsQuery = query(
      behaviorsRef,
      orderBy("createdAt", "desc")
    );
    const behaviorsSnapshot = await getDocs(behaviorsQuery);
    const allBehaviors = behaviorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by classId and date in JavaScript
    const filteredBehaviors = allBehaviors.filter(behavior => 
      behavior.classId === classId && behavior.date === date
    );
    
    return { success: true, data: filteredBehaviors };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
