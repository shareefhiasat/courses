/**
 * Lookup Types Hook - SINGLE SOURCE OF TRUTH
 * 
 * PURPOSE: Fetch and manage all lookup types from the unified lookup API
 * ARCHITECTURE: Components → Hooks → Services → API → Database
 * 
 * This hook provides access to ALL lookup data from the single source of truth
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { getActivityTypeOptions } from '@constants/qrScannerTypes.jsx';
import api from '@api';

/**
 * Generic lookup API client - SINGLE SOURCE OF TRUTH
 */
class LookupApiClient {
  /**
   * Get single lookup type
   * @param {string} type - Lookup type key
   * @param {object} options - Query options
   */
  async getLookup(type, options = {}) {
    const params = new URLSearchParams();
    
    // Add query parameters
    if (options.activeOnly !== undefined) {
      params.append('activeOnly', options.activeOnly.toString());
    }
    if (options.fields) {
      params.append('fields', options.fields.join(','));
    }
    if (options.orderBy) {
      params.append('orderBy', `${options.orderBy.field}:${options.orderBy.direction}`);
    }
    
    const url = `/lookup/${type}${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      const result = await api.get(url);
      return result;
    } catch (err) {
      error('[Lookup API] Error fetching lookup:', err);
      throw err;
    }
  }

  /**
   * Get multiple lookup types at once
   * @param {Array} types - Array of lookup type keys
   * @param {object} options - Query options
   */
  async getMultipleLookups(types, options = {}) {
    const params = new URLSearchParams();
    
    params.append('types', types.join(','));
    
    if (options.activeOnly !== undefined) {
      params.append('activeOnly', options.activeOnly.toString());
    }
    if (options.fields) {
      params.append('fields', options.fields.join(','));
    }
    if (options.orderBy) {
      params.append('orderBy', `${options.orderBy.field}:${options.orderBy.direction}`);
    }
    
    const url = `/lookup${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      const result = await api.get(url);
      return result;
    } catch (err) {
      error('[Lookup API] Error fetching multiple lookups:', err);
      throw err;
    }
  }

  /**
   * Get all available lookup types (metadata)
   */
  async getLookupTypes() {
    try {
      const result = await api.get('/lookup/types');
      return result;
    } catch (err) {
      error('[Lookup API] Error fetching lookup types:', err);
      throw err;
    }
  }
}

const lookupApi = new LookupApiClient();

/**
 * Main lookup hook - SINGLE SOURCE OF TRUTH
 * 
 * @param {object} options - Hook options
 * @param {Array} options.types - Specific lookup types to fetch (default: activity-related types)
 * @param {boolean} options.activeOnly - Fetch only active records (default: true)
 * @param {Array} options.fields - Specific fields to select (optional)
 * @param {object} options.orderBy - Order by configuration (optional)
 */
export function useLookupTypes(options = {}) {
  const { user } = useAuth();
  
  // Use JSON.stringify to create a stable key for options
  const optionsKey = useMemo(() => {
    return JSON.stringify({
      types: options.types || ['behavior-types', 'participation-types', 'penalty-types'],
      activeOnly: options.activeOnly !== undefined ? options.activeOnly : true,
      fields: options.fields || null,
      orderBy: options.orderBy || { field: 'nameEn', direction: 'asc' }
    });
  }, [options.types, options.activeOnly, options.fields, options.orderBy]);
  
  // Use the key to create stable options
  const stableOptions = useMemo(() => {
    const parsed = JSON.parse(optionsKey);
    return parsed;
  }, [optionsKey]);
  
  const {
    types,
    activeOnly,
    fields,
    orderBy
  } = stableOptions;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [data, setData] = useState({});

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      const result = await lookupApi.getMultipleLookups(types, {
        activeOnly,
        fields,
        orderBy
      });
      
      if (result.success) {
        setData(result.data);
        // info('🔍 [useLookupTypes] Fetched lookup types:', {
        //   requestedTypes: types,
        //   fetchedTypes: Object.keys(result.data),
        //   counts: Object.keys(result.data).reduce((acc, key) => {
        //     acc[key] = result.data[key].length;
        //     return acc;
        //   }, {})
        // });
      } else {
        throw new Error(result.message || 'Failed to fetch lookup types');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch lookup types';
      error('🔍 [useLookupTypes] Error:', errorMessage);
      setFetchError(errorMessage);
      
      // Fallback to empty object on error
      setData({});
    } finally {
      setLoading(false);
    }
  }, [stableOptions]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const refetch = useCallback(() => {
    fetchTypes();
  }, [fetchTypes]);

  // Memoized activity type options for StudentActionZapPanel
  const activityTypeOptions = useMemo(() => {
    return getActivityTypeOptions(data);
  }, [data]);

  return {
    loading,
    error: fetchError,
    data,
    activityTypeOptions,
    refetch,
    // Additional utilities
    getLookupType: (type) => data[type] || [],
    hasLookupType: (type) => !!data[type],
    lookupTypes: types
  };
}

/**
 * Specialized hook for specific lookup types
 * 
 * @param {string} lookupType - Single lookup type key
 * @param {object} options - Query options
 */
export function useLookupType(lookupType, options = {}) {
  const result = useLookupTypes({ 
    types: [lookupType], 
    ...options 
  });
  
  return {
    ...result,
    data: result.data[lookupType] || [],
    lookupType
  };
}

/**
 * Hook for getting all available lookup types (metadata)
 */
export function useLookupTypesMetadata() {
  const [loading, setLoading] = useState(true);
  const [metadataError, setMetadataError] = useState(null);
  const [data, setData] = useState([]);

  const fetchMetadata = useCallback(async () => {
    try {
      setLoading(true);
      setMetadataError(null);
      
      const result = await lookupApi.getLookupTypes();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch lookup types metadata');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch lookup types metadata';
      error('🔍 [useLookupTypesMetadata] Error:', err);
      setMetadataError(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    loading,
    error: metadataError,
    data,
    refetch: fetchMetadata
  };
}
