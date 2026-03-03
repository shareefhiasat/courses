/**
 * Safe Update Utilities
 * Provides safe wrapper functions for Firestore operations
 */

import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Safely updates a document with error handling
 */
export const safeUpdateDoc = async (collectionPath, docId, updates) => {
  try {
    const docRef = doc(db, collectionPath, docId);
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating document:', error);
    return { success: false, error };
  }
};

/**
 * Safely increments a field in a document
 */
export const safeIncrementDoc = async (collectionPath, docId, field, amount = 1) => {
  try {
    const docRef = doc(db, collectionPath, docId);
    await updateDoc(docRef, {
      [field]: increment(amount),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing document:', error);
    return { success: false, error };
  }
};
