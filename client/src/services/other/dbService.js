/**
 * Database Service - Centralized Firebase database operations
 * Provides a clean interface for all Firestore database operations
 */

import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc, deleteDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./config";
import logger from '@utils/logger';

/**
 * Database Service - Centralized Firestore operations
 */
export const dbService = {
  /**
   * Get database instance
   */
  getDb: () => db,

  /**
   * Get collection reference
   * @param {string} collectionName - Name of the collection
   * @returns {CollectionReference} Firestore collection reference
   */
  getCollectionRef: (collectionName) => {
    return collection(db, collectionName);
  },

  /**
   * Get document reference
   * @param {string} collectionName - Name of the collection
   * @param {string} docId - Document ID
   * @returns {DocumentReference} Firestore document reference
   */
  getDocRef: (collectionName, docId) => {
    return doc(db, collectionName, docId);
  },

  /**
   * Add a document to a collection
   * @param {string} collectionName - Name of the collection
   * @param {object} data - Document data
   * @returns {Promise<object>} - Result with success, data, error
   */
  add: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        timestamp: serverTimestamp()
      });
      logger.log(`[dbService] Document added to ${collectionName}: ${docRef.id}`);
      return { success: true, data: { id: docRef.id, ...data } };
    } catch (error) {
      logger.error(`[dbService] Error adding document to ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all documents from a collection
   * @param {string} collectionName - Name of the collection
   * @param {object} options - Query options (where, orderBy, limit)
   * @returns {Promise<object>} - Result with success, data, error
   */
  getAll: async (collectionName, options = {}) => {
    try {
      let q = collection(db, collectionName);
      
      // Apply query constraints
      const constraints = [];
      if (options.where) {
        constraints.push(where(options.where.field, options.where.operator, options.where.value));
      }
      if (options.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
      }
      if (options.limit) {
        constraints.push(limit(options.limit));
      }
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        docId: doc.id,
        ...doc.data()
      }));
      
      logger.log(`[dbService] Retrieved ${documents.length} documents from ${collectionName}`);
      return { success: true, data: documents };
    } catch (error) {
      logger.error(`[dbService] Error getting documents from ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get a single document by ID
   * @param {string} collectionName - Name of the collection
   * @param {string} docId - Document ID
   * @returns {Promise<object>} - Result with success, data, error
   */
  getById: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          docId: docSnap.id,
          ...docSnap.data()
        };
        logger.log(`[dbService] Retrieved document from ${collectionName}: ${docId}`);
        return { success: true, data };
      } else {
        logger.warn(`[dbService] Document not found in ${collectionName}: ${docId}`);
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      logger.error(`[dbService] Error getting document from ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update a document
   * @param {string} collectionName - Name of the collection
   * @param {string} docId - Document ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - Result with success, error
   */
  update: async (collectionName, docId, updateData) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, updateData);
      logger.log(`[dbService] Updated document in ${collectionName}: ${docId}`);
      return { success: true };
    } catch (error) {
      logger.error(`[dbService] Error updating document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a document
   * @param {string} collectionName - Name of the collection
   * @param {string} docId - Document ID
   * @returns {Promise<object>} - Result with success, error
   */
  delete: async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      logger.log(`[dbService] Deleted document from ${collectionName}: ${docId}`);
      return { success: true };
    } catch (error) {
      logger.error(`[dbService] Error deleting document from ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Set a document (overwrite)
   * @param {string} collectionName - Name of the collection
   * @param {string} docId - Document ID
   * @param {object} data - Document data
   * @returns {Promise<object>} - Result with success, error
   */
  set: async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data);
      logger.log(`[dbService] Set document in ${collectionName}: ${docId}`);
      return { success: true };
    } catch (error) {
      logger.error(`[dbService] Error setting document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Subscribe to real-time updates
   * @param {string} collectionName - Name of the collection
   * @param {function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe: (collectionName, callback) => {
    try {
      const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          docId: doc.id,
          ...doc.data()
        }));
        callback(documents);
      });
      return unsubscribe;
    } catch (error) {
      logger.error(`[dbService] Error subscribing to ${collectionName}:`, error);
      return () => {};
    }
  },

  /**
   * Subscribe to a single document updates
   * @param {string} collectionName - Name of the collection
   * @param {string} docId - Document ID
   * @param {function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToDoc: (collectionName, docId, callback) => {
    try {
      const unsubscribe = onSnapshot(doc(db, collectionName, docId), (snapshot) => {
        if (snapshot.exists()) {
          const data = {
            id: snapshot.id,
            docId: snapshot.id,
            ...snapshot.data()
          };
          callback(data);
        } else {
          callback(null);
        }
      });
      return unsubscribe;
    } catch (error) {
      logger.error(`[dbService] Error subscribing to document in ${collectionName}:`, error);
      return () => {};
    }
  }
};

export default dbService;
