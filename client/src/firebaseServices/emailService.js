import { db } from './config';
import { doc, getDoc, updateDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';

/**
 * Email Service
 * Handles email sending and SMTP configuration
 */

// Send email via Firebase Functions
export const sendEmail = async (emailData) => {
  try {
    const { httpsCallable } = await import("firebase/functions");
    const { functions } = await import("./config");
    const sendEmailFunction = httpsCallable(functions, "sendEmail");
    const result = await sendEmailFunction(emailData);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error sending email:", error);
    // Surface more info when available
    const message =
      error && (error.message || error.code)
        ? `${error.code || ""} ${error.message}`.trim()
        : "Unknown error";
    return { success: false, error: message };
  }
};

// Get SMTP configuration
// DEPRECATED: Use client/src/config/smtp.js getSMTPConfig() instead
// This function is kept for backward compatibility and as fallback
export const getSMTPConfig = async () => {
  try {
    // Try to use centralized config first
    try {
      const { getSMTPConfig: getCentralizedSMTPConfig } = await import('../config/smtp');
      const config = await getCentralizedSMTPConfig();
      // Convert to old format for backward compatibility
      return { success: true, data: config };
    } catch (importError) {
      // Fallback to Firestore if centralized config not available
      const docRef = doc(db, "config", "smtp");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      }
      return { success: true, data: null };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update SMTP configuration
export const updateSMTPConfig = async (configData) => {
  try {
    const docRef = doc(db, "config", "smtp");
    await updateDoc(docRef, configData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add email log
export const addEmailLog = async (logData) => {
  try {
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
    const docRef = await addDoc(collection(db, "emailLogs"), {
      ...logData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get email logs
export const getEmailLogs = async () => {
  try {
    const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
    const q = query(collection(db, "emailLogs"), orderBy("createdAt", "desc"));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete email log
export const deleteEmailLog = async (id) => {
  try {
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, "emailLogs", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== EMAIL TEMPLATES =====

/**
 * Get email templates
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getEmailTemplates = async () => {
  try {
    const q = query(
      collection(db, "emailTemplates"),
      orderBy("createdAt", "desc")
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    console.error("Error getting email templates:", error);
    return { success: false, error: error.message };
  }
};
