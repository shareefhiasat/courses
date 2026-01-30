import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * Delete a participation record
 */
export async function deleteParticipation(participationId) {
  try {
    if (!participationId) {
      return { success: false, error: 'Participation ID is required' };
    }
    
    await deleteDoc(doc(db, 'participations', participationId));
    console.log('[Participation] Deleted participation record:', participationId);
    
    return { success: true };
  } catch (error) {
    console.error('[Participation] Error deleting participation record:', error);
    return { success: false, error: error.message };
  }
}
