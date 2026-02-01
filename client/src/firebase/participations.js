import { doc, deleteDoc, collection, addDoc, serverTimestamp, updateDoc, setDoc, getDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './config';
import { addNotification } from './notifications';
import { sendEmail } from './firestore';

/**
 * Create a participation record
 * Participation records are stored in the attendance collection as delta records
 * @param {Object} params
 * @param {string} params.classId - Class ID
 * @param {string} params.studentId - Student user ID
 * @param {string} params.date - Date string (YYYY-MM-DD)
 * @param {number} params.delta - Participation points (positive for participation, negative for behavior)
 * @param {string} params.category - 'participation' or 'behavior'
 * @param {string} params.createdBy - User ID who created the record
 * @param {string} params.notes - Optional notes
 * @param {Object} params.studentInfo - Optional { email, displayName } for notifications
 * @param {string} params.className - Optional class name for notifications
 * @param {boolean} params.sendNotification - Whether to send notification (default: true)
 */
export async function createParticipation({
  classId,
  studentId,
  date,
  delta,
  category,
  createdBy,
  notes = '',
  studentInfo = null,
  className = '',
  sendNotification = true
}) {
  try {
    const attendanceRef = collection(db, 'attendance');
    // Generate unique ID for participation/behavior records
    const participationId = `${classId}_${studentId}_${date}_${category || 'participation'}_${Date.now()}`;
    
    const docRef = doc(attendanceRef, participationId);
    
    await setDoc(docRef, {
      classId,
      studentId,
      date,
      delta,
      category,
      markedBy: createdBy,
      method: 'manual',
      notes,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Track creation info
      createdBy,
      createdAt: serverTimestamp()
    });

    // Send notification to student if requested
    if (sendNotification && studentId) {
      try {
        const categoryLabel = category === 'behavior' ? 'Behavior' : 'Participation';
        const actionLabel = delta > 0 ? 'added' : 'recorded';
        const formattedDate = new Date(date).toLocaleDateString('en-GB');
        
        // In-app notification
        await addNotification({
          userId: studentId,
          title: `📝 ${categoryLabel} ${actionLabel}`,
          message: `${categoryLabel} ${actionLabel} for ${className || 'class'} on ${formattedDate}${notes ? ` - ${notes}` : ''}`,
          type: category,
          classId: classId,
          metadata: {
            date,
            delta,
            category,
            className: className,
            method: 'manual'
          },
          data: { 
            classId, 
            date, 
            delta,
            category
          }
        });

        // Email notification for significant changes
        if (studentInfo?.email && Math.abs(delta) >= 2) {
          try {
            await sendEmail({
              to: studentInfo.email,
              template: 'participationNotification',
              type: category,
              classId: classId,
              data: {
                studentName: studentInfo.displayName || studentInfo.email,
                className: className || 'Class',
                date: formattedDate,
                category: categoryLabel,
                delta: delta,
                notes: notes || ''
              },
              metadata: {
                classId,
                className,
                date,
                category,
                delta
              }
            });
          } catch (emailError) {
            console.warn('Failed to send participation email:', emailError);
          }
        }
      } catch (notifyError) {
        console.warn('Failed to send participation notification:', notifyError);
      }
    }

    return { success: true, id: participationId };
  } catch (error) {
    console.error('Error creating participation record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a participation record
 * @param {string} participationId - Participation record ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.updatedBy - User ID who updated the record
 */
export async function updateParticipation(participationId, { updatedBy, ...updateData }) {
  try {
    const docRef = doc(db, 'attendance', participationId);
    
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
    console.error('Error updating participation record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a participation record
 * Note: Participation records are stored in the attendance collection as delta records
 */
export async function deleteParticipation(participationId) {
  try {
    if (!participationId) {
      return { success: false, error: 'Participation ID is required' };
    }
    
    // Participation records are stored in the attendance collection
    await deleteDoc(doc(db, 'attendance', participationId));
    console.log('[Participation] Deleted participation record from attendance collection:', participationId);
    
    return { success: true };
  } catch (error) {
    console.error('[Participation] Error deleting participation record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get participations by class and date
 * @param {string} classId - Class ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getParticipationsByClassAndDate = async (classId, date) => {
  try {
    const participationsRef = collection(db, "participations");
    // Get all participations ordered by createdAt (no where clause to avoid index requirement)
    const participationsQuery = query(
      participationsRef,
      orderBy("createdAt", "desc")
    );
    const participationsSnapshot = await getDocs(participationsQuery);
    const allParticipations = participationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by classId and date in JavaScript
    const filteredParticipations = allParticipations.filter(participation => 
      participation.classId === classId && participation.date === date
    );
    
    return { success: true, data: filteredParticipations };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
