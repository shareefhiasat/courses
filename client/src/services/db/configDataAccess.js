import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Configuration Data Access
 * 
 * Replaced Firebase Firestore with localStorage and API calls
 */

const CONFIG_COLLECTION = 'config';

export const getConfigDoc = async (docId) => {
  // Mock implementation - replace with GraphQL query
  info('📄 Get config doc (mock):', { docId });
  
  // Try localStorage first
  try {
    const cached = localStorage.getItem(`config_${docId}`);
    if (cached) {
      return { exists: true, data: () => JSON.parse(cached) };
    }
  } catch (error) {
    warn('localStorage read failed:', error);
  }
  
  // Return mock data
  const mockData = {
    attendance: {
      sessionDuration: 60,
      autoClose: true,
      allowLate: true,
      lateThreshold: 15
    },
    system: {
      version: '1.0.0',
      maintenance: false,
      features: {
        keycloakAuth: true,
        analytics: false
      }
    }
  };
  
  return { 
    exists: mockData[docId] ? true : false, 
    data: () => mockData[docId] || null 
  };
};

export const setConfigDoc = async (docId, data) => {
  // Mock implementation - replace with GraphQL mutation
  info('💾 Set config doc (mock):', { docId, data });
  
  // Save to localStorage
  try {
    localStorage.setItem(`config_${docId}`, JSON.stringify(data));
  } catch (error) {
    warn('localStorage write failed:', error);
  }
  
  return { success: true };
};

export const updateConfigDoc = async (docId, data) => {
  // Mock implementation - replace with GraphQL mutation
  info('🔄 Update config doc (mock):', { docId, data });
  
  // Get existing data and merge
  const existing = await getConfigDoc(docId);
  const merged = existing.exists() 
    ? { ...existing.data(), ...data }
    : data;
    
  return await setConfigDoc(docId, merged);
};
