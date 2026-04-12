/**
 * Workflow Inbox Hook
 * 
 * PURPOSE: Hook for managing workflow inbox operations
 * ARCHITECTURE: UI Components → Hooks → Business Services → Backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { getWorkflowInbox, getWorkflowDocuments, markWorkflowInboxItemAsRead } from '@services/business/workflowService';

const useWorkflowInbox = (initialParams = {}) => {
  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    viewMode: 'all',
    isRead: null,
    action: '',
    recipientId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialParams
  });

  /**
   * Fetch inbox items with current filters
   */
  const fetchInboxItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const mode = filters.viewMode || 'all';
      const inboxParams = {
        page: pagination.page,
        limit: pagination.limit,
        isRead: filters.isRead,
        action: filters.action,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const sentParams = {
        page: pagination.page,
        limit: pagination.limit,
        createdBy: 'me',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.recipientId) {
        sentParams.currentAssigneeId = filters.recipientId;
      }

      if (mode === 'received') {
        const result = await getWorkflowInbox(inboxParams);
        if (result.success) {
          const receivedRows = (result.data || []).map((item) => ({
            ...item,
            rowType: 'received'
          }));

          const searchTerm = String(filters.search || '').trim().toLowerCase();
          const filteredReceivedRows = receivedRows.filter((row) => {
            if (!searchTerm) return true;
            return (row.document?.title || '').toLowerCase().includes(searchTerm)
              || (row.document?.description || '').toLowerCase().includes(searchTerm);
          });

          setInboxItems(filteredReceivedRows);
          setPagination((prev) => ({
            ...prev,
            total: filteredReceivedRows.length,
            totalPages: Math.max(1, Math.ceil(filteredReceivedRows.length / pagination.limit))
          }));
        } else {
          setError(result.error || 'Failed to fetch inbox items');
          setInboxItems([]);
        }
      } else if (mode === 'sent') {
        const result = await getWorkflowDocuments(sentParams);
        if (result.success) {
          const sentRows = (result.data || []).map((doc) => ({
            id: `sent-${doc.id}`,
            rowType: 'sent',
            isRead: true,
            action: 'sent',
            createdAt: doc.updatedAt || doc.createdAt,
            documentId: doc.id,
            document: doc
          }));

          const searchTerm = String(filters.search || '').trim().toLowerCase();
          const filteredSentRows = sentRows.filter((row) => {
            const matchesSearch = !searchTerm ||
              (row.document?.title || '').toLowerCase().includes(searchTerm) ||
              (row.document?.description || '').toLowerCase().includes(searchTerm);
            const matchesAction = !filters.action || filters.action === 'sent';
            const matchesRead = filters.isRead === null || filters.isRead === true || filters.isRead === 'true';
            return matchesSearch && matchesAction && matchesRead;
          });

          setInboxItems(filteredSentRows);
          setPagination((prev) => ({
            ...prev,
            total: filteredSentRows.length,
            totalPages: Math.max(1, Math.ceil(filteredSentRows.length / pagination.limit))
          }));
        } else {
          setError(result.error || 'Failed to fetch sent workflow items');
          setInboxItems([]);
        }
      } else {
        const [inboxResult, sentResult] = await Promise.all([
          getWorkflowInbox({ ...inboxParams, page: 1, limit: 200 }),
          getWorkflowDocuments({ ...sentParams, page: 1, limit: 200 })
        ]);

        if (!inboxResult.success && !sentResult.success) {
          setError(inboxResult.error || sentResult.error || 'Failed to fetch workflow items');
          setInboxItems([]);
          return;
        }

        const receivedRows = inboxResult.success
          ? (inboxResult.data || []).map((item) => ({ ...item, rowType: 'received' }))
          : [];

        const sentRows = sentResult.success
          ? (sentResult.data || []).map((doc) => ({
            id: `sent-${doc.id}`,
            rowType: 'sent',
            isRead: true,
            action: 'sent',
            createdAt: doc.updatedAt || doc.createdAt,
            documentId: doc.id,
            document: doc
          }))
          : [];

        const searchTerm = String(filters.search || '').trim().toLowerCase();
        const mergedRows = [...receivedRows, ...sentRows]
          .filter((row) => {
            const matchesSearch = !searchTerm ||
              (row.document?.title || '').toLowerCase().includes(searchTerm) ||
              (row.document?.description || '').toLowerCase().includes(searchTerm);
            const matchesAction = !filters.action || row.action === filters.action;
            const matchesRead = filters.isRead === null || row.isRead === (filters.isRead === true || filters.isRead === 'true');
            return matchesSearch && matchesAction && matchesRead;
          })
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;

        setInboxItems(mergedRows.slice(startIndex, endIndex));
        setPagination((prev) => ({
          ...prev,
          total: mergedRows.length,
          totalPages: Math.max(1, Math.ceil(mergedRows.length / pagination.limit))
        }));
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setInboxItems([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  /**
   * Mark inbox item as read
   */
  const markAsRead = useCallback(async (inboxItemId) => {
    try {
      const result = await markWorkflowInboxItemAsRead(inboxItemId);
      
      if (result.success) {
        // Update local state
        setInboxItems(prev => 
          prev.map(item => 
            item.id === inboxItemId 
              ? { ...item, isRead: true, readAt: new Date().toISOString() }
              : item
          )
        );
      } else {
        setError(result.error || 'Failed to mark item as read');
      }
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to mark item as read');
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  /**
   * Update pagination
   */
  const updatePagination = useCallback((newPagination) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  /**
   * Refresh inbox
   */
  const refresh = useCallback(() => {
    fetchInboxItems();
  }, [fetchInboxItems]);

  /**
   * Get unread count
   */
  const getUnreadCount = useCallback(() => {
    return inboxItems.filter(item => !item.isRead).length;
  }, [inboxItems]);

  /**
   * Get items by action type
   */
  const getItemsByAction = useCallback((action) => {
    return inboxItems.filter(item => item.action === action);
  }, [inboxItems]);

  /**
   * Bulk mark as read
   */
  const bulkMarkAsRead = useCallback(async (itemIds) => {
    const results = await Promise.allSettled(
      itemIds.map(id => markAsRead(id))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;
    
    if (failed > 0) {
      setError(`Failed to mark ${failed} item(s) as read`);
    }
    
    return { successful, failed };
  }, [markAsRead]);

  // Auto-refresh on filter/pagination changes
  useEffect(() => {
    fetchInboxItems();
  }, [fetchInboxItems]);

  return {
    // Data
    inboxItems,
    loading,
    error,
    pagination,
    filters,
    
    // Computed
    unreadCount: getUnreadCount(),
    
    // Actions
    fetchInboxItems,
    markAsRead,
    updateFilters,
    updatePagination,
    refresh,
    getItemsByAction,
    bulkMarkAsRead
  };
};

export default useWorkflowInbox;
