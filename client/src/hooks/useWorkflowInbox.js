/**
 * Workflow Inbox Hook
 * 
 * PURPOSE: Hook for managing workflow document inbox operations
 * ARCHITECTURE: UI Components → Hooks → Business Services → Backend API
 * 
 * REFACTOR: Unified to use WorkflowDocument as single source of truth
 * - Removed legacy WorkflowInboxItem concept
 * - Simplified to use only WorkflowDocument model
 * - Aligned with SmartDrive and WorkflowDocumentDetailPage
 * - Added SLA urgency notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getWorkflowDocuments } from '@services/business/workflowService';
import { getSlaInfo, sortBySlaUrgency } from '@utils/sla.js';

const useWorkflowInbox = (initialParams = {}, onNotification = null) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    viewMode: 'all', // 'all', 'needs_action', 'waiting', 'completed'
    status: '',
    workflowType: '',
    search: '',
    sortBy: 'sla', // 'sla', 'createdAt', 'updatedAt'
    sortOrder: 'asc', // 'asc' for SLA (urgent first), 'desc' for dates
    ...initialParams
  });

  // Track previous document states for change detection
  const previousDocumentsRef = useRef([]);
  const previousStatsRef = useRef({ urgent: 0, pending: 0, completed: 0 });

  /**
   * Calculate statistics from documents
   */
  const calculateStats = useCallback((docs) => {
    const now = new Date();
    
    return docs.reduce((stats, doc) => {
      const submittedAt = doc.submittedAt || doc.createdAt;
      const slaInfo = getSlaInfo(submittedAt);
      const isUrgent = slaInfo.isOverdue || slaInfo.hoursRemaining < 4;
      const isPending = !['APPROVED', 'REJECTED', 'CLOSED'].includes(doc.status);
      const isCompleted = ['APPROVED', 'CLOSED'].includes(doc.status);
      
      if (isUrgent && isPending) {
        stats.urgent++;
      } else if (isPending) {
        stats.pending++;
      } else if (isCompleted) {
        stats.completed++;
      }
      
      return stats;
    }, { urgent: 0, pending: 0, completed: 0 });
  }, []);

  const [stats, setStats] = useState({ urgent: 0, pending: 0, completed: 0 });

  /**
   * Check for SLA urgency changes and trigger notifications
   */
  const checkSlaUrgency = useCallback((currentDocs, previousDocs) => {
    if (!onNotification) return;

    currentDocs.forEach(currentDoc => {
      const previousDoc = previousDocs.find(d => d.id === currentDoc.id);
      const currentSubmittedAt = currentDoc.submittedAt || currentDoc.createdAt;
      
      if (!previousDoc) {
        // New document assigned
        const slaInfo = getSlaInfo(currentSubmittedAt);
        if (slaInfo.isOverdue) {
          onNotification('warning', 'Overdue Document', `"${currentDoc.title}" is overdue by ${Math.abs(slaInfo.hoursRemaining - 72).toFixed(1)} hours`);
        } else if (slaInfo.hoursRemaining < 4) {
          onNotification('warning', 'Urgent Document', `"${currentDoc.title}" needs attention - only ${slaInfo.hoursRemaining.toFixed(1)} hours remaining`);
        }
      } else {
        // Check if status changed
        if (previousDoc.status !== currentDoc.status) {
          if (currentDoc.status === 'APPROVED') {
            onNotification('success', 'Document Approved', `"${currentDoc.title}" has been approved`);
          } else if (currentDoc.status === 'REJECTED') {
            onNotification('error', 'Document Rejected', `"${currentDoc.title}" has been rejected`);
          } else if (currentDoc.status === 'UNDER_HR_REVIEW' || currentDoc.status === 'UNDER_ADMIN_REVIEW') {
            onNotification('info', 'Document Under Review', `"${currentDoc.title}" is now under review`);
          }
        }
        
        // Check if SLA became urgent
        const previousSubmittedAt = previousDoc.submittedAt || previousDoc.createdAt;
        const currentSla = getSlaInfo(currentSubmittedAt);
        const previousSla = getSlaInfo(previousSubmittedAt);
        
        if (!previousSla.isOverdue && currentSla.isOverdue) {
          onNotification('error', 'SLA Overdue', `"${currentDoc.title}" has exceeded the 72-hour SLA deadline`);
        } else if (previousSla.hoursRemaining >= 4 && currentSla.hoursRemaining < 4 && !currentSla.isOverdue) {
          onNotification('warning', 'SLA Warning', `"${currentDoc.title}" is approaching deadline - ${currentSla.hoursRemaining.toFixed(1)} hours remaining`);
        }
      }
    });
  }, [onNotification]);

  /**
   * Fetch workflow documents with current filters
   */
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build API params - only use supported params
      const apiParams = {
        limit: 200, // Fetch more for client-side filtering
        offset: 0
      };
      
      // Add status filter if specified
      if (filters.status) {
        apiParams.status = filters.status;
      }
      
      // Add workflow type filter if specified
      if (filters.workflowType) {
        apiParams.workflowType = filters.workflowType;
      }
      
      const result = await getWorkflowDocuments(apiParams);
      
      if (result.success) {
        let filteredDocs = result.data || [];
        
        // Client-side filtering for view mode
        if (filters.viewMode === 'needs_action') {
          // Documents assigned to current user that need action
          filteredDocs = filteredDocs.filter(doc => {
            const needsAction = ['SUBMITTED', 'UNDER_HR_REVIEW', 'UNDER_ADMIN_REVIEW'].includes(doc.status);
            return needsAction;
          });
        } else if (filters.viewMode === 'waiting') {
          // Documents submitted by current user waiting for review
          filteredDocs = filteredDocs.filter(doc => {
            const isWaiting = ['SUBMITTED', 'UNDER_HR_REVIEW', 'UNDER_ADMIN_REVIEW'].includes(doc.status);
            return isWaiting;
          });
        } else if (filters.viewMode === 'completed') {
          // Completed documents
          filteredDocs = filteredDocs.filter(doc => {
            const isCompleted = ['APPROVED', 'REJECTED', 'CLOSED'].includes(doc.status);
            return isCompleted;
          });
        }
        
        // Search filter
        if (filters.search) {
          const searchTerm = String(filters.search).trim().toLowerCase();
          filteredDocs = filteredDocs.filter(doc => {
            return (doc.title || '').toLowerCase().includes(searchTerm) ||
                   (doc.description || '').toLowerCase().includes(searchTerm) ||
                   (doc.submitter?.displayName || '').toLowerCase().includes(searchTerm);
          });
        }
        
        // Sort by SLA urgency (default) or date
        if (filters.sortBy === 'sla') {
          filteredDocs = sortBySlaUrgency(filteredDocs);
        } else if (filters.sortBy === 'createdAt') {
          filteredDocs.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
        } else if (filters.sortBy === 'updatedAt') {
          filteredDocs.sort((a, b) => {
            const dateA = new Date(a.updatedAt || 0).getTime();
            const dateB = new Date(b.updatedAt || 0).getTime();
            return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
        }
        
        // Check for SLA urgency changes (only on refresh, not initial load)
        if (previousDocumentsRef.current.length > 0) {
          checkSlaUrgency(filteredDocs, previousDocumentsRef.current);
        }
        
        // Store current documents for next comparison
        previousDocumentsRef.current = filteredDocs;
        
        // Calculate stats
        const newStats = calculateStats(filteredDocs);
        
        // Check for stats changes
        if (previousStatsRef.current.urgent !== newStats.urgent && onNotification) {
          if (newStats.urgent > previousStatsRef.current.urgent) {
            onNotification('warning', 'Urgent Documents', `${newStats.urgent} documents now require urgent attention`);
          }
        }
        previousStatsRef.current = newStats;
        
        // Client-side pagination
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedDocs = filteredDocs.slice(startIndex, endIndex);
        
        setDocuments(paginatedDocs);
        setStats(newStats);
        setPagination((prev) => ({
          ...prev,
          total: filteredDocs.length,
          totalPages: Math.max(1, Math.ceil(filteredDocs.length / pagination.limit))
        }));
      } else {
        setError(result.error || 'Failed to fetch workflow documents');
        setDocuments([]);
        setStats({ urgent: 0, pending: 0, completed: 0 });
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setDocuments([]);
      setStats({ urgent: 0, pending: 0, completed: 0 });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, calculateStats, checkSlaUrgency, onNotification]);

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
   * Refresh documents
   */
  const refresh = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /**
   * Get documents by status
   */
  const getDocumentsByStatus = useCallback((status) => {
    return documents.filter(doc => doc.status === status);
  }, [documents]);

  // Auto-refresh on filter/pagination changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Optional: Poll for updates every 30 seconds (can be enabled if needed)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchDocuments();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDocuments, loading]);

  return {
    // Data
    documents, // Renamed from inboxItems for clarity
    loading,
    error,
    pagination,
    filters,
    stats, // New: statistics for UI
    
    // Computed
    unreadCount: stats.urgent + stats.pending, // Simplified
    
    // Actions
    fetchDocuments,
    updateFilters,
    updatePagination,
    refresh,
    getDocumentsByStatus
  };
};

export default useWorkflowInbox;
