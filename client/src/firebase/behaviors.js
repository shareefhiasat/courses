import { doc, deleteDoc, collection, addDoc, serverTimestamp, updateDoc, getDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './config';
import { addNotification } from './notifications';
import { sendEmail } from './firestore';

const toYmd = (tsOrDate) => {
  if (!tsOrDate) return null;
  const d = tsOrDate?.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Create a behavior record
 * @param {Object} params
 * @param {string} params.classId - Class ID
 * @param {string} params.studentId - Student user ID
 * @param {string} params.subjectId - Optional subject ID
 * @param {string} params.type - Type of behavior
 * @param {number} params.points - Behavior points (negative for behavior issues)
 * @param {string} params.description - Optional description
 * @param {string} params.createdBy - User ID who created the record
 * @param {string} params.date - Optional date string (YYYY-MM-DD)
 * @param {Object} params.studentInfo - Optional { email, displayName } for notifications
 * @param {string} params.className - Optional class name for notifications
 * @param {boolean} params.sendNotification - Whether to send notification (default: true)
 */
export async function createBehavior({
  classId,
  studentId,
  subjectId = null,
  type = 'behavior',
  points = 0,
  description = '',
  createdBy,
  date = null,
  studentInfo = null,
  className = '',
  sendNotification = true
}) {
  try {
    const todayStr = date || toYmd(new Date());

    const payload = {
      classId,
      studentId,
      ...(subjectId ? { subjectId } : {}),
      type,
      points,
      description,
      date: todayStr,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'behaviors'), payload);

    if (sendNotification && studentId) {
      try {
        const formattedDate = new Date(todayStr).toLocaleDateString('en-GB');
        
        // In-app notification
        await addNotification({
          userId: studentId,
          title: '⚠️ Behavior Recorded',
          message: `Behavior recorded for ${className || 'class'} on ${formattedDate}${description ? ` - ${description}` : ''}`,
          type: 'behavior',
          classId: classId,
          metadata: {
            date: todayStr,
            points,
            type,
            className: className,
            method: 'manual'
          },
          data: { 
            classId, 
            date: todayStr, 
            points,
            type
          }
        });

        if (studentInfo?.email && Math.abs(points) >= 2) {
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
                behaviorType: type,
                delta: points,
                notes: description || ''
              },
              metadata: {
                classId,
                className,
                date: todayStr,
                type,
                points
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
      behavior.classId === classId && (
        behavior.date === date || toYmd(behavior.createdAt) === date
      )
    );
    
    return { success: true, data: filteredBehaviors };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBehaviors = async () => {
  try {
    const behaviorsRef = collection(db, 'behaviors');
    const behaviorsQuery = query(behaviorsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(behaviorsQuery);
    const allBehaviors = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
    return { success: true, data: allBehaviors };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
