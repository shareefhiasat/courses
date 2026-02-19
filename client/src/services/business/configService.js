import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from '../other/config';
import { 
  CONFIG_TYPES, 
  DEFAULT_CONFIG, 
  getConfigTypeLabel, 
  validateConfigValue, 
  mergeWithDefaults,
  getStudentRank, 
  getRankConfig 
} from "@constants/sharedConfig";

/**
 * Enhanced Configuration Management Service
 * Handles system-wide configuration with proper typing and validation
 */

// ===== CORE CONFIG FUNCTIONS =====

/**
 * Get configuration by type
 * @param {string} type - Configuration type from CONFIG_TYPES
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getConfig = async (type, lang = 'en') => {
  try {
    if (!Object.values(CONFIG_TYPES).includes(type)) {
      return { 
        success: false, 
        error: `Invalid config type: ${type}. Valid types: ${Object.values(CONFIG_TYPES).join(', ')}` 
      };
    }

    const docRef = doc(db, "config", type);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const configData = docSnap.data();
      const mergedConfig = mergeWithDefaults(type, configData);
      
      return { 
        success: true, 
        data: {
          ...mergedConfig,
          type,
          label: getConfigTypeLabel(type, lang),
          lastUpdated: configData.updatedAt?.toDate()
        }
      };
    } else {
      // Return default config if none exists
      return { 
        success: true, 
        data: {
          ...DEFAULT_CONFIG[type],
          type,
          label: getConfigTypeLabel(type, lang),
          lastUpdated: null
        }
      };
    }
  } catch (error) {
    logger.error(`Error getting config for ${type}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Update configuration by type
 * @param {string} type - Configuration type from CONFIG_TYPES
 * @param {Object} configData - Configuration data to update
 * @param {string} userId - User ID making the change (for audit)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateConfig = async (type, configData, userId = null) => {
  try {
    if (!Object.values(CONFIG_TYPES).includes(type)) {
      return { 
        success: false, 
        error: `Invalid config type: ${type}` 
      };
    }

    // Validate the configuration data
    if (!validateConfigValue(type, configData)) {
      return { 
        success: false, 
        error: `Invalid configuration data for type: ${type}` 
      };
    }

    const docRef = doc(db, "config", type);
    const mergedConfig = mergeWithDefaults(type, configData);
    
    await updateDoc(docRef, {
      ...mergedConfig,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
    
    return { success: true };
  } catch (error) {
    logger.error(`Error updating config for ${type}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Set configuration (create or update)
 * @param {string} type - Configuration type from CONFIG_TYPES
 * @param {Object} configData - Configuration data to set
 * @param {string} userId - User ID making the change (for audit)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setConfig = async (type, configData, userId = null) => {
  try {
    if (!Object.values(CONFIG_TYPES).includes(type)) {
      return { 
        success: false, 
        error: `Invalid config type: ${type}` 
      };
    }

    // Validate the configuration data
    if (!validateConfigValue(type, configData)) {
      return { 
        success: false, 
        error: `Invalid configuration data for type: ${type}` 
      };
    }

    const docRef = doc(db, "config", type);
    const mergedConfig = mergeWithDefaults(type, configData);
    
    await setDoc(docRef, {
      ...mergedConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId
    });
    
    return { success: true };
  } catch (error) {
    logger.error(`Error setting config for ${type}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all configurations
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAllConfigs = async (lang = 'en') => {
  try {
    const configs = [];
    
    for (const type of Object.values(CONFIG_TYPES)) {
      const result = await getConfig(type, lang);
      if (result.success) {
        configs.push(result.data);
      }
    }
    
    return { success: true, data: configs };
  } catch (error) {
    logger.error("Error getting all configs:", error);
    return { success: false, error: error.message };
  }
};

// ===== LEGACY FUNCTIONS (for backward compatibility) =====

/**
 * Get allowlist configuration (legacy function)
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getAllowlist = async () => {
  const result = await getConfig(CONFIG_TYPES.ALLOWLIST);
  if (result.success) {
    return {
      success: true,
      data: {
        allowedEmails: result.data.allowedEmails || [],
        adminEmails: result.data.adminEmails || [],
        enabled: result.data.enabled || true,
        requireApproval: result.data.requireApproval || false
      }
    };
  }
  return result;
};

/**
 * Update allowlist configuration (legacy function)
 * @param {Object} allowlistData - Allowlist data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAllowlist = async (allowlistData) => {
  return await updateConfig(CONFIG_TYPES.ALLOWLIST, allowlistData);
};

// ===== SYSTEM SETTINGS FUNCTIONS =====

/**
 * Get system settings
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getSystemSettings = async () => {
  return await getConfig(CONFIG_TYPES.SYSTEM_SETTINGS);
};

/**
 * Update system settings
 * @param {Object} settings - System settings to update
 * @param {string} userId - User ID making the change
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSystemSettings = async (settings, userId) => {
  return await updateConfig(CONFIG_TYPES.SYSTEM_SETTINGS, settings, userId);
};

// ===== SCHEDULED REPORTS FUNCTIONS =====

/**
 * Get scheduled reports
 * @param {string} userId - Optional user ID to filter reports
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getScheduledReports = async (userId = null) => {
  try {
    const q = userId 
      ? query(
          collection(db, "scheduledReports"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        )
      : query(
          collection(db, "scheduledReports"),
          orderBy("createdAt", "desc")
        );
    
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => {
      const data = d.data();
      items.push({
        id: d.id,
        ...data,
        nextRunAt: data.nextRunAt?.toDate(),
        lastRunAt: data.lastRunAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });
    return { success: true, data: items };
  } catch (error) {
    logger.error("Error getting scheduled reports:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Add scheduled report
 * @param {Object} reportData - Report data to add
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const addScheduledReport = async (reportData) => {
  try {
    const docRef = await addDoc(collection(db, "scheduledReports"), {
      ...reportData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error("Error adding scheduled report:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update scheduled report
 * @param {string} id - Report ID to update
 * @param {Object} reportData - Report data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateScheduledReport = async (id, reportData) => {
  try {
    await updateDoc(doc(db, "scheduledReports", id), {
      ...reportData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error("Error updating scheduled report:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete scheduled report
 * @param {string} id - Report ID to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteScheduledReport = async (id) => {
  try {
    await deleteDoc(doc(db, "scheduledReports", id));
    return { success: true };
  } catch (error) {
    logger.error("Error deleting scheduled report:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get role screens configuration
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getRoleScreens = async () => {
  try {
    const docRef = doc(db, "config", "roleScreens");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'Role screens configuration not found' };
    }
  } catch (error) {
    logger.error("Error getting role screens:", error);
    return { success: false, error: error.message };
  }
};

