import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Custom hook for debounced search functionality in history drawers
 * @param {Array} data - The history data array to search through
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @returns {Object} - { searchTerm, setSearchTerm, filteredData, clearSearch }
 */
export const useHistorySearch = (data = [], debounceMs = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);

  // Debounce search term to improve performance
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, debounceMs]);

  // Memoized filtered data for performance
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return data.filter(entry => {
      // Search in action type
      if (entry.actionType && entry.actionType.toLowerCase().includes(searchLower)) return true;
      
      // Search in user name
      if (entry.user && `${entry.user.firstName} ${entry.user.lastName}`.toLowerCase().includes(searchLower)) return true;
      
      // Search in attempt type (First/Repeated)
      if (entry.recordSnapshot?.isRepeated !== undefined) {
        if (entry.recordSnapshot.isRepeated && 'repeated'.includes(searchLower)) return true;
        if (!entry.recordSnapshot.isRepeated && 'first'.includes(searchLower)) return true;
      }
      
      // Search in field names
      if (entry.changes && entry.changes.some(change => 
        change.fieldName && change.fieldName.toLowerCase().includes(searchLower)
      )) return true;
      
      // Search in old/new values
      if (entry.changes && entry.changes.some(change => 
        (change.oldValue && change.oldValue.toString().toLowerCase().includes(searchLower)) ||
        (change.newValue && change.newValue.toString().toLowerCase().includes(searchLower))
      )) return true;
      
      // Search in record snapshot values
      if (entry.recordSnapshot && Object.values(entry.recordSnapshot).some(value => 
        value && value.toString().toLowerCase().includes(searchLower)
      )) return true;
      
      return false;
    });
  }, [data, debouncedSearchTerm]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    clearSearch,
    hasSearch: !!debouncedSearchTerm
  };
};

export default useHistorySearch;
