import { db } from '../other/config';

/**
 * Collection Management Service
 * Provides utilities for managing large collections safely
 */

/**
 * Delete all documents in a collection with progress tracking
 * @param {string} collectionName - Name of the collection
 * @param {Function} onProgress - Progress callback (processed, total, percentage)
 * @param {Object} options - Options for deletion
 * @returns {Promise<{success: boolean, deletedCount: number, error?: string}>}
 */
export const deleteCollection = async (collectionName, onProgress = null, options = {}) => {
  const {
    batchSize = 400,
    delayBetweenBatches = 100,
    maxRetries = 3
  } = options;

  try {
    // This function would need to be implemented in the database layer
    // For now, we'll delegate to a database service when available
    logger.warn(`deleteCollection called for ${collectionName} - needs database service implementation`);
    
    return { success: false, error: 'Database service not yet implemented for collection management' };
  } catch (error) {
    logger.error(`Error deleting collection ${collectionName}:`, error);
    return { 
      success: false, 
      error: error.message,
      deletedCount: 0 
    };
  }
};

/**
 * Get collection statistics
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<{count: number, sizeEstimate: string, error?: string}>}
 */
export const getCollectionStats = async (collectionName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    
    const count = querySnapshot.size;
    const sizeEstimate = estimateCollectionSize(count);
    
    return {
      count,
      sizeEstimate
    };
  } catch (error) {
    logger.error(`Error getting stats for collection ${collectionName}:`, error);
    return {
      count: 0,
      sizeEstimate: 'Unknown',
      error: error.message
    };
  }
};

/**
 * Estimate collection size based on document count
 * @param {number} docCount - Number of documents
 * @returns {string} Human readable size estimate
 */
const estimateCollectionSize = (docCount) => {
  if (docCount < 1000) return `${docCount} documents (Small)`;
  if (docCount < 10000) return `${docCount} documents (Medium)`;
  if (docCount < 100000) return `${docCount} documents (Large)`;
  return `${docCount} documents (Very Large)`;
};

/**
 * Archive old documents instead of deleting them
 * @param {string} sourceCollection - Source collection name
 * @param {string} targetCollection - Target collection name (archive)
 * @param {Function} dateFilter - Function to filter documents by date
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, archivedCount: number, error?: string}>}
 */
export const archiveOldDocuments = async (
  sourceCollection, 
  targetCollection, 
  dateFilter,
  onProgress = null
) => {
  try {
    const sourceRef = collection(db, sourceCollection);
    const targetRef = collection(db, targetCollection);
    const querySnapshot = await getDocs(sourceRef);
    
    if (querySnapshot.empty) {
      return { success: true, archivedCount: 0 };
    }

    const docsToArchive = querySnapshot.docs.filter(doc => dateFilter(doc));
    let totalArchived = 0;
    const batchSize = 400;

    for (let i = 0; i < docsToArchive.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docsToArchive.slice(i, i + batchSize);
      
      // Copy to archive
      batchDocs.forEach((doc) => {
        const archiveRef = doc(targetRef, doc.id);
        batch.set(archiveRef, doc.data());
        // Delete from source
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalArchived += batchDocs.length;
      
      // Report progress
      if (onProgress) {
        const percentage = Math.round((totalArchived / docsToArchive.length) * 100);
        onProgress(totalArchived, docsToArchive.length, percentage);
      }
      
      // Add delay between batches
      if (i + batchSize < docsToArchive.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { 
      success: true, 
      archivedCount: totalArchived 
    };
    
  } catch (error) {
    logger.error(`Error archiving documents from ${sourceCollection}:`, error);
    return { 
      success: false, 
      error: error.message,
      archivedCount: 0 
    };
  }
};

/**
 * Delete documents by type/category instead of all
 * @param {string} collectionName - Collection name
 * @param {string} fieldName - Field to filter by (e.g., 'type')
 * @param {string} fieldValue - Field value to delete
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, deletedCount: number, error?: string}>}
 */
export const deleteDocumentsByField = async (
  collectionName, 
  fieldName, 
  fieldValue, 
  onProgress = null
) => {
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    
    if (querySnapshot.empty) {
      return { success: true, deletedCount: 0 };
    }

    const docsToDelete = querySnapshot.docs.filter(doc => 
      doc.data()[fieldName] === fieldValue
    );
    
    if (docsToDelete.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    let totalDeleted = 0;
    const batchSize = 400;

    for (let i = 0; i < docsToDelete.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docsToDelete.slice(i, i + batchSize);
      
      batchDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += batchDocs.length;
      
      // Report progress
      if (onProgress) {
        const percentage = Math.round((totalDeleted / docsToDelete.length) * 100);
        onProgress(totalDeleted, docsToDelete.length, percentage);
      }
      
      // Add delay between batches
      if (i + batchSize < docsToDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { 
      success: true, 
      deletedCount: totalDeleted 
    };
    
  } catch (error) {
    logger.error(`Error deleting documents by field from ${collectionName}:`, error);
    return { 
      success: false, 
      error: error.message,
      deletedCount: 0 
    };
  }
};

