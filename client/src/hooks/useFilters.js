/**
 * useFilters Hook
 * Manages filter state with URL query param sync
 * Filters: type, date, owner, status
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState([]);

  // Parse filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const parsedFilters = [];

    // Parse type filters
    const types = params.get('type');
    if (types) {
      types.split(',').forEach(value => {
        parsedFilters.push({ type: 'type', value });
      });
    }

    // Parse date filter
    const date = params.get('date');
    if (date) {
      parsedFilters.push({ type: 'date', value: date });
    }

    // Parse owner filter
    const owner = params.get('owner');
    if (owner) {
      parsedFilters.push({ type: 'owner', value: owner });
    }

    // Parse status filters
    const status = params.get('status');
    if (status) {
      status.split(',').forEach(value => {
        parsedFilters.push({ type: 'status', value });
      });
    }

    setFilters(parsedFilters);
  }, [location.search]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters) => {
    const params = new URLSearchParams();

    // Group filters by type
    const grouped = newFilters.reduce((acc, filter) => {
      if (!acc[filter.type]) acc[filter.type] = [];
      acc[filter.type].push(filter.value);
      return acc;
    }, {});

    // Add to URL params
    Object.entries(grouped).forEach(([type, values]) => {
      if (type === 'date' || type === 'owner') {
        // Single value filters
        params.set(type, values[0]);
      } else {
        // Multi-value filters
        params.set(type, values.join(','));
      }
    });

    // Preserve existing search query
    const searchParams = new URLSearchParams(location.search);
    const search = searchParams.get('q');
    if (search) {
      params.set('q', search);
    }

    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location.pathname, location.search]);

  const addFilter = useCallback((filter) => {
    setFilters(prev => {
      // For single-value filters (date, owner), replace existing
      if (filter.type === 'date' || filter.type === 'owner') {
        const newFilters = prev.filter(f => f.type !== filter.type);
        newFilters.push(filter);
        updateURL(newFilters);
        return newFilters;
      }

      // For multi-value filters, check if already exists
      const exists = prev.some(f => f.type === filter.type && f.value === filter.value);
      if (exists) return prev;

      const newFilters = [...prev, filter];
      updateURL(newFilters);
      return newFilters;
    });
  }, [updateURL]);

  const removeFilter = useCallback((filter) => {
    setFilters(prev => {
      const newFilters = prev.filter(
        f => !(f.type === filter.type && f.value === filter.value)
      );
      updateURL(newFilters);
      return newFilters;
    });
  }, [updateURL]);

  const clearAllFilters = useCallback(() => {
    setFilters([]);
    updateURL([]);
  }, [updateURL]);

  // Convert filters to API query params
  const toAPIParams = useCallback(() => {
    const params = {};

    filters.forEach(filter => {
      switch (filter.type) {
        case 'type':
          if (!params.mimeTypes) params.mimeTypes = [];
          params.mimeTypes.push(filter.value);
          break;
        case 'date':
          params.dateRange = filter.value;
          break;
        case 'owner':
          params.owner = filter.value;
          break;
        case 'status':
          if (filter.value === 'starred') params.isStarred = true;
          if (filter.value === 'trash') params.isDeleted = true;
          if (filter.value === 'recent') params.sortBy = 'recent';
          break;
      }
    });

    return params;
  }, [filters]);

  return {
    filters,
    addFilter,
    removeFilter,
    clearAllFilters,
    toAPIParams,
  };
}

export default useFilters;
