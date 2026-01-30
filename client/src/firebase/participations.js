import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './config';

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
