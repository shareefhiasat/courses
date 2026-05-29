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
import { useAuth } from '@contexts/AuthContext';
import { getWorkflowDocuments } from '@services/business/workflowService';
import { getSlaInfo, sortBySlaUrgency } from '@utils/sla.js';

const useWorkflowInbox = (initialParams = {}, onNotification = null) => {
  const { user } = useAuth();
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
    assignment: '', // 'assigned_to_me', 'assigned_to_my_role'
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
            onNotification('info', 'Document Under Review', `"${currentDoc.title}" is now under HR review`);
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
      
      // Add role parameter for HR/Admin users to see assignee inbox
      const userRoles = user?.roles || [];
      if (userRoles.includes('HR') || userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) {
        apiParams.role = 'assignee';
        console.log('[WorkflowInbox] User is HR/Admin, using role=assignee');
      }
      
      // Add status filter if specified
      if (filters.status) {
        apiParams.status = filters.status;
        console.log('[WorkflowInbox] Status filter applied:', filters.status);
      }
      
      // Add workflow type filter if specified
      if (filters.workflowType) {
        apiParams.workflowType = filters.workflowType;
      }
      
      const result = await getWorkflowDocuments(apiParams);
      
      console.log('[WorkflowInbox] API Result:', {
        success: result.success,
        dataCount: result.data?.length,
        apiParams,
        userDbId: result.userDbId
      });
      
      if (result.success) {
        let filteredDocs = result.data || [];
        
        // Use userDbId from API response if available, otherwise fall back to context
        const currentUserDbId = result.userDbId || user?.dbId;
        
        console.log('[WorkflowInbox] Using userDbId:', currentUserDbId, {
          fromApi: !!result.userDbId,
          fromContext: !!user?.dbId
        });
        
        console.log('[WorkflowInbox] Initial documents count:', filteredDocs.length);
        
        // Client-side filtering for view mode
        if (filters.viewMode === 'needs_action') {
          // Documents assigned to current user that need action
          filteredDocs = filteredDocs.filter(doc => {
            const needsAction = ['SUBMITTED', 'UNDER_REVIEW', 'UNDER_ADMIN_REVIEW'].includes(doc.status);
            const isAssignedToMe = doc.currentAssigneeId === user?.id;
            return needsAction && isAssignedToMe;
          });
        } else if (filters.viewMode === 'waiting') {
          // Documents submitted by current user waiting for review
          filteredDocs = filteredDocs.filter(doc => {
            const isWaiting = ['SUBMITTED', 'UNDER_REVIEW', 'UNDER_ADMIN_REVIEW'].includes(doc.status);
            const isSubmittedByMe = doc.submitterId === user?.id;
            return isWaiting && isSubmittedByMe;
          });
        } else if (filters.viewMode === 'completed') {
          // Completed documents
          filteredDocs = filteredDocs.filter(doc => {
            const isCompleted = ['APPROVED', 'REJECTED', 'CLOSED'].includes(doc.status);
            return isCompleted;
          });
        }
        
        // Search filter - search all columns
        if (filters.search) {
          const searchTerm = String(filters.search).trim().toLowerCase();
          filteredDocs = filteredDocs.filter(doc => {
            // Search in document fields
            const titleMatch = (doc.title || '').toLowerCase().includes(searchTerm);
            const descriptionMatch = (doc.description || '').toLowerCase().includes(searchTerm);
            const statusMatch = (doc.status || '').toLowerCase().includes(searchTerm);
            const nextStatusMatch = (doc.nextStatus || '').toLowerCase().includes(searchTerm);
            const workflowTypeMatch = (doc.workflowType || '').toLowerCase().includes(searchTerm);
            const programMatch = (doc.program || '').toLowerCase().includes(searchTerm);
            const subjectMatch = (doc.subject || '').toLowerCase().includes(searchTerm);
            
            // Search in submitter
            const submitterMatch = 
              (doc.submitter?.displayName || '').toLowerCase().includes(searchTerm) ||
              (doc.submitter?.firstName || '').toLowerCase().includes(searchTerm) ||
              (doc.submitter?.lastName || '').toLowerCase().includes(searchTerm) ||
              (doc.submitter?.email || '').toLowerCase().includes(searchTerm);
            
            // Search in assignee
            const assigneeMatch = 
              (doc.currentAssignee?.displayName || '').toLowerCase().includes(searchTerm) ||
              (doc.currentAssignee?.firstName || '').toLowerCase().includes(searchTerm) ||
              (doc.currentAssignee?.lastName || '').toLowerCase().includes(searchTerm) ||
              (doc.currentAssignee?.email || '').toLowerCase().includes(searchTerm);
            
            // Search in role-based assignments (when assigneeId is null)
            const roleAssignmentMatch = 
              doc.currentAssigneeId === null && (
                (doc.workflowType === 'GENERAL' && 'hr'.includes(searchTerm)) ||
                (doc.workflowType === 'ATTENDANCE_WEEKLY' && 'admin'.includes(searchTerm)) ||
                (doc.workflowType === 'GENERAL' && 'hr review'.includes(searchTerm)) ||
                (doc.workflowType === 'ATTENDANCE_WEEKLY' && 'admin review'.includes(searchTerm))
              );
            
            // Search in class
            const classMatch = (doc.class?.name || '').toLowerCase().includes(searchTerm);
            
            // Search in instructor
            const instructorMatch = 
              (doc.instructor?.displayName || '').toLowerCase().includes(searchTerm) ||
              (doc.instructor?.firstName || '').toLowerCase().includes(searchTerm) ||
              (doc.instructor?.lastName || '').toLowerCase().includes(searchTerm) ||
              (doc.instructor?.email || '').toLowerCase().includes(searchTerm);
            
            return titleMatch || descriptionMatch || statusMatch || nextStatusMatch || workflowTypeMatch || 
                   programMatch || subjectMatch || submitterMatch || assigneeMatch || roleAssignmentMatch ||
                   classMatch || instructorMatch;
          });
        }
        
        // Assignment filter
        if (filters.assignment === 'assigned_to_me') {
          console.log('[WorkflowInbox] Assignment filter: assigned_to_me', {
            userId: user?.id,
            currentAssigneeIds: filteredDocs.map(d => ({ id: d.id, assigneeId: d.currentAssigneeId }))
          });
          filteredDocs = filteredDocs.filter(doc => doc.currentAssigneeId === user?.id);
          console.log('[WorkflowInbox] After assigned_to_me filter:', filteredDocs.length);
        } else if (filters.assignment === 'assigned_to_my_role') {
          // Get user's roles from AuthContext (uppercase strings like 'HR', 'ADMIN')
          const userRoles = user?.roles || [];
          console.log('[WorkflowInbox] Assignment filter: assigned_to_my_role', {
            userRoles,
            userId: user?.id
          });
          filteredDocs = filteredDocs.filter(doc => {
            // For role-based assignments (currentAssigneeId is null), check workflowType
            if (doc.currentAssigneeId === null) {
              const isHR = userRoles.includes('HR');
              const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
              
              // HR can see GENERAL workflow documents
              if (isHR && doc.workflowType === 'GENERAL') {
                console.log('[WorkflowInbox] Document matches HR role filter (role-based):', {
                  docId: doc.id,
                  workflowType: doc.workflowType
                });
                return true;
              }
              
              // Admin can see ATTENDANCE_WEEKLY workflow documents
              if (isAdmin && doc.workflowType === 'ATTENDANCE_WEEKLY') {
                console.log('[WorkflowInbox] Document matches Admin role filter (role-based):', {
                  docId: doc.id,
                  workflowType: doc.workflowType
                });
                return true;
              }
              
              return false;
            }
            
            // For specific user assignments, check if assignee has user's roles
            const assigneeRoleCodes = doc.currentAssignee?.roleAssignments?.map(ra => ra.role?.code) || [];
            const matches = assigneeRoleCodes.some(code => userRoles.includes(code));
            if (matches) {
              console.log('[WorkflowInbox] Document matches role filter (user assignment):', {
                docId: doc.id,
                assigneeRoleCodes,
                userRoles
              });
            }
            return matches;
          });
          console.log('[WorkflowInbox] After assigned_to_my_role filter:', filteredDocs.length);
        } else if (filters.assignment === 'i_own') {
          console.log('[WorkflowInbox] Assignment filter: i_own', {
            userId: user?.id,
            submitterKeycloakIds: filteredDocs.map(d => ({ id: d.id, submitterKeycloakId: d.submitter?.keycloakId }))
          });
          
          if (!user?.id) {
            console.warn('[WorkflowInbox] user.id is undefined, cannot filter by i_own.');
            filteredDocs = [];
          } else {
            filteredDocs = filteredDocs.filter(doc => doc.submitter?.keycloakId === user?.id);
          }
          console.log('[WorkflowInbox] After i_own filter:', filteredDocs.length);
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
