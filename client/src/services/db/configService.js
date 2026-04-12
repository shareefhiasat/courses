// Mock implementation - Firebase replaced with API calls
// import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, query, where, orderBy, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
// import { db } from '../other/config';
import { info, error, warn, debug } from '@services/utils/logger.js';
// import { getConfigDoc, setConfigDoc } from './configDataAccess';
import {
  CONFIG_TYPES,
  DEFAULT_CONFIG,
  getConfigTypeLabel,
  validateConfigValue,
  mergeWithDefaults,
  getStudentRank,
  getRankConfig,
} from '@constants/sharedConfig';

// Mock Firebase functions
const serverTimestamp = () => new Date();
const doc = (db, collection, id) => ({ collection, id });
const getDoc = async (ref) => ({ exists: () => false, data: () => ({}) });
const updateDoc = async (ref, data) => Promise.resolve();
const setDoc = async (ref, data) => Promise.resolve();
const collection = (db, name) => ({ name });
const query = (...args) => args;
const where = (field, op, value) => ({ field, op, value });
const orderBy = (field, direction = 'asc') => ({ field, direction });
const getDocs = async (q) => ({ forEach: () => {} });
const addDoc = async (ref, data) => ({ id: Math.random().toString(36) });
const deleteDoc = async (ref) => Promise.resolve();
const db = {}; // Mock database

export const getConfig = async (type, lang = 'en') => {
  try {
    if (!Object.values(CONFIG_TYPES).includes(type)) {
      return {
        success: false,
        error: `Invalid config type: ${type}. Valid types: ${Object.values(CONFIG_TYPES).join(', ')}`,
      };
    }

    const docRef = doc(db, 'config', type);
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
          lastUpdated: configData.updatedAt?.toDate(),
        },
      };
    }

    return {
      success: true,
      data: {
        ...DEFAULT_CONFIG[type],
        type,
        label: getConfigTypeLabel(type, lang),
        lastUpdated: null,
      },
    };
  } catch (error) {
    if (
      error.message.includes('Missing or insufficient permissions') ||
      error.code === 'permission-denied' ||
      error.message.includes('No document to update')
    ) {
      warn(`Config collection not available for ${type}, returning default config:`, { error: error.message });
      return {
        success: true,
        data: {
          ...DEFAULT_CONFIG[type],
          type,
          label: getConfigTypeLabel(type, lang),
          lastUpdated: null,
        },
      };
    }

    error(`Error getting config for ${type}:`, error);
    return { success: false, error: error.message };
  }
};

export const updateConfig = async (type, configData, userId = null) => {
  try {
    if (!Object.values(CONFIG_TYPES).includes(type)) {
      return { success: false, error: `Invalid config type: ${type}` };
    }

    if (!validateConfigValue(type, configData)) {
      return { success: false, error: `Invalid configuration data for type: ${type}` };
    }

    const docRef = doc(db, 'config', type);
    const mergedConfig = mergeWithDefaults(type, configData);

    await updateDoc(docRef, {
      ...mergedConfig,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    if (
      error.message.includes('Missing or insufficient permissions') ||
      error.code === 'permission-denied' ||
      error.message.includes('No document to update')
    ) {
      warn(`Config collection not available for ${type}, creating new document:`, { error: error.message });
      try {
        const docRef = doc(db, 'config', type);
        const mergedConfig = mergeWithDefaults(type, configData);

        await setDoc(docRef, {
          ...mergedConfig,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: userId,
        });

        return { success: true };
      } catch (createError) {
        error(`Failed to create config document for ${type}:`, createError);
        return { success: false, error: createError.message };
      }
    }

    error(`Error updating config for ${type}:`, error);
    return { success: false, error: error.message };
  }
};

export const setConfig = async (type, configData, userId = null) => {
  try {
    if (!Object.values(CONFIG_TYPES).includes(type)) {
      return { success: false, error: `Invalid config type: ${type}` };
    }

    if (!validateConfigValue(type, configData)) {
      return { success: false, error: `Invalid configuration data for type: ${type}` };
    }

    const docRef = doc(db, 'config', type);
    const mergedConfig = mergeWithDefaults(type, configData);

    await setDoc(docRef, {
      ...mergedConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
    });

    return { success: true };
  } catch (error) {
    if (
      error.message.includes('Missing or insufficient permissions') ||
      error.code === 'permission-denied' ||
      error.message.includes('No document to update')
    ) {
      warn(`Config collection not available for ${type}, cannot create document:`, { error: error.message });
      return {
        success: false,
        error: "Config collection not available. Please check Firestore permissions for the 'config' collection.",
      };
    }

    error(`Error setting config for ${type}:`, error);
    return { success: false, error: error.message };
  }
};

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
    error('Error getting all configs:', error);
    return { success: false, error: error.message };
  }
};

// REMOVED: getAllowlist and updateAllowlist - Keycloak is now the source of truth for users

export const getSystemSettings = async () => {
  return await getConfig(CONFIG_TYPES.SYSTEM_SETTINGS);
};

export const updateSystemSettings = async (settings, userId) => {
  return await updateConfig(CONFIG_TYPES.SYSTEM_SETTINGS, settings, userId);
};

export const getScheduledReports = async (userId = null) => {
  try {
    const q = userId
      ? query(collection(db, 'scheduledReports'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
      : query(collection(db, 'scheduledReports'), orderBy('createdAt', 'desc'));

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
        updatedAt: data.updatedAt?.toDate(),
      });
    });
    return { success: true, data: items };
  } catch (error) {
    error('Error getting scheduled reports:', error);
    return { success: false, error: error.message };
  }
};

export const addScheduledReport = async (reportData) => {
  try {
    const docRef = await addDoc(collection(db, 'scheduledReports'), {
      ...reportData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    error('Error adding scheduled report:', error);
    return { success: false, error: error.message };
  }
};

export const updateScheduledReport = async (id, reportData) => {
  try {
    await updateDoc(doc(db, 'scheduledReports', id), {
      ...reportData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    error('Error updating scheduled report:', error);
    return { success: false, error: error.message };
  }
};

export const deleteScheduledReport = async (id) => {
  try {
    await deleteDoc(doc(db, 'scheduledReports', id));
    return { success: true };
  } catch (error) {
    error('Error deleting scheduled report:', error);
    return { success: false, error: error.message };
  }
};

// REMOVED: getRoleScreens, updateRoleScreens, getNotificationSettings, updateNotificationSettings
// RBAC is now handled via Keycloak roles and static screen definitions

export { getStudentRank, getRankConfig };
