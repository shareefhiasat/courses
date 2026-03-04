/**
 * File Storage Service
 * Handles file uploads to Firebase Storage with audit trail
 * Supports shared folders for multi-role access
 */

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../other/config';
import { addDoc, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';
import { REPORT_TYPES, STORAGE_CONSTANTS } from '@constants/reportConstants';

/**
 * Upload file to Firebase Storage with metadata
 * @param {Object} params - Upload parameters
 * @param {Blob|File|string} params.file - File to upload (Blob, File, or string content)
 * @param {string} params.filename - Name of the file
 * @param {string} params.folder - Folder path (e.g., 'reports', 'shared', 'user_uploads')
 * @param {string} params.userId - ID of user uploading
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadFile = async ({ file, filename, folder, userId, metadata = {} }) => {
  try {
    logger.info('[FileStorage] Starting file upload', { filename, folder, userId });
    
    // Convert string content to Blob if needed
    let fileToUpload = file;
    if (typeof file === 'string') {
      fileToUpload = new Blob([file], { type: metadata.contentType || 'text/plain' });
    }
    
    // Create storage reference
    const timestamp = Date.now();
    
    // Safety check for filename
    if (!filename || typeof filename !== 'string') {
      throw new Error('Filename must be a non-empty string');
    }
    
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folder}/${timestamp}_${sanitizedFilename}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload file with minimal metadata to avoid 400 error
    const uploadResult = await uploadBytes(storageRef, fileToUpload);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Create Firestore record for audit trail
    const fileRecord = {
      filename: sanitizedFilename,
      originalFilename: filename,
      storagePath,
      downloadURL,
      folder,
      uploadedBy: userId,
      uploadedAt: new Date(),
      size: uploadResult.metadata.size,
      contentType: uploadResult.metadata.contentType,
      metadata: {
        ...metadata,
        fullPath: uploadResult.metadata.fullPath
      },
      accessControl: {
        public: STORAGE_CONSTANTS.ACCESS.PUBLIC, // Make files public for sharing
        sharedWith: [], // Array of user IDs or role names
        allowedRoles: metadata.allowedRoles || []
      },
      status: STORAGE_CONSTANTS.STATUS.ACTIVE,
      downloads: 0,
      lastAccessedAt: null
    };
    
    const docRef = await addDoc(collection(db, 'files'), fileRecord);
    
    logger.info('[FileStorage] File uploaded successfully', { 
      fileId: docRef.id, 
      downloadURL,
      storagePath 
    });
    
    return {
      success: true,
      fileId: docRef.id,
      downloadURL,
      storagePath,
      filename: sanitizedFilename,
      metadata: fileRecord
    };
    
  } catch (error) {
    logger.error('[FileStorage] File upload failed', error);
    throw error;
  }
};

/**
 * Upload CSV report with audit trail
 * @param {Object} params - Report parameters
 * @param {string} params.csvContent - CSV content as string
 * @param {string} params.filename - Report filename
 * @param {string} params.userId - User ID
 * @param {Object} params.reportMetadata - Report metadata (program, class, etc.)
 * @returns {Promise<Object>} Upload result
 */
export const uploadReport = async ({ csvContent, filename, userId, reportMetadata = {} }) => {
  try {
    logger.info('[FileStorage] Uploading report', { filename, userId });
    
    // Filter out undefined values to prevent Firebase errors
    const filteredMetadata = {
      type: 'report',
      reportType: reportMetadata.reportType || REPORT_TYPES.SUMMARY_REPORT,
      programId: reportMetadata.programId,
      programName: reportMetadata.programName,
      classId: reportMetadata.classId,
      className: reportMetadata.className,
      subjectId: reportMetadata.subjectId,
      subjectName: reportMetadata.subjectName,
      generatedAt: new Date().toISOString(),
      totalStudents: reportMetadata.totalStudents,
      selectedSubjects: reportMetadata.selectedSubjects,
      contentType: STORAGE_CONSTANTS.CONTENT_TYPES.CSV,
      allowedRoles: ['admin', 'super_admin', 'hr', 'instructor']
    };

    // Remove undefined values
    Object.keys(filteredMetadata).forEach(key => {
      if (filteredMetadata[key] === undefined) {
        delete filteredMetadata[key];
      }
    });

    const result = await uploadFile({
      file: csvContent,
      filename,
      folder: STORAGE_CONSTANTS.FOLDERS.REPORTS,
      userId,
      metadata: filteredMetadata
    });
    
    logger.info('[FileStorage] Report uploaded successfully', { fileId: result.fileId });
    
    return result;
    
  } catch (error) {
    logger.error('[FileStorage] Report upload failed', error);
    throw error;
  }
};

/**
 * Get file by ID with access control check
 * @param {string} fileId - File document ID
 * @param {string} userId - User requesting access
 * @param {string} userRole - User's role
 * @returns {Promise<Object>} File metadata
 */
export const getFile = async (fileId, userId, userRole) => {
  try {
    const fileDoc = await getDocs(query(collection(db, 'files'), where('__name__', '==', fileId)));
    
    if (fileDoc.empty) {
      throw new Error('File not found');
    }
    
    const fileData = { id: fileDoc.docs[0].id, ...fileDoc.docs[0].data() };
    
    // Check access control
    const hasAccess = 
      fileData.uploadedBy === userId ||
      fileData.accessControl.public ||
      fileData.accessControl.sharedWith.includes(userId) ||
      fileData.accessControl.allowedRoles.includes(userRole);
    
    if (!hasAccess) {
      throw new Error('Access denied');
    }
    
    // Update access stats
    await updateDoc(doc(db, 'files', fileId), {
      downloads: (fileData.downloads || 0) + 1,
      lastAccessedAt: new Date()
    });
    
    return fileData;
    
  } catch (error) {
    logger.error('[FileStorage] Get file failed', error);
    throw error;
  }
};

/**
 * List files in a folder with access control
 * @param {string} folder - Folder path
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} List of files
 */
export const listFiles = async (folder, userId, userRole, filters = {}) => {
  try {
    let q = query(
      collection(db, 'files'),
      where('folder', '==', folder),
      where('status', '==', 'active')
    );
    
    // Apply additional filters
    if (filters.reportType) {
      q = query(q, where('metadata.reportType', '==', filters.reportType));
    }
    
    const snapshot = await getDocs(q);
    
    // Filter by access control
    const files = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(file => 
        file.uploadedBy === userId ||
        file.accessControl.public ||
        file.accessControl.sharedWith.includes(userId) ||
        file.accessControl.allowedRoles.includes(userRole)
      );
    
    return files;
    
  } catch (error) {
    logger.error('[FileStorage] List files failed', error);
    throw error;
  }
};

/**
 * Share file with users or roles
 * @param {string} fileId - File ID
 * @param {Array<string>} userIds - User IDs to share with
 * @param {Array<string>} roles - Roles to share with
 * @returns {Promise<void>}
 */
export const shareFile = async (fileId, userIds = [], roles = []) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    
    await updateDoc(fileRef, {
      'accessControl.sharedWith': userIds,
      'accessControl.allowedRoles': roles,
      updatedAt: new Date()
    });
    
    logger.info('[FileStorage] File shared successfully', { fileId, userIds, roles });
    
  } catch (error) {
    logger.error('[FileStorage] Share file failed', error);
    throw error;
  }
};

/**
 * Delete file from storage and Firestore
 * @param {string} fileId - File ID
 * @param {string} userId - User requesting deletion
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileId, userId) => {
  try {
    const fileDoc = await getDocs(query(collection(db, 'files'), where('__name__', '==', fileId)));
    
    if (fileDoc.empty) {
      throw new Error('File not found');
    }
    
    const fileData = fileDoc.docs[0].data();
    
    // Check if user has permission to delete
    if (fileData.uploadedBy !== userId) {
      throw new Error('Access denied');
    }
    
    // Delete from storage
    const storageRef = ref(storage, fileData.storagePath);
    await deleteObject(storageRef);
    
    // Mark as deleted in Firestore (soft delete)
    await updateDoc(doc(db, 'files', fileId), {
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy: userId
    });
    
    logger.info('[FileStorage] File deleted successfully', { fileId });
    
  } catch (error) {
    logger.error('[FileStorage] Delete file failed', error);
    throw error;
  }
};

export default {
  uploadFile,
  uploadReport,
  getFile,
  listFiles,
  shareFile,
  deleteFile
};
