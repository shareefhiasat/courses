import { useMemo } from 'react';

/**
 * Custom hook to calculate filter counts for status filters
 * Encapsulates the filter count logic to reduce prop drilling
 * 
 * @param {Array} items - Array of items to count (activities, resources, submissions, etc.)
 * @param {Object} options - Configuration options
 * @param {string} options.mode - Current mode ('activities', 'resources', 'quiz')
 * @param {Object} options.userProgress - User progress data (for resources)
 * @param {Object} options.submissions - Submissions data (for activities)
 * @returns {Object} Filter counts object
 */
export const useFilterCounts = (items, options = {}) => {
  const {
    mode = 'activities',
    userProgress = {},
    submissions = {},
    activityType = 'all'
  } = options;

  return useMemo(() => {
    if (!items || items.length === 0) {
      return {
        completedCount: 0,
        pendingCount: 0,
        requiredCount: 0,
        optionalCount: 0,
        overdueCount: 0,
        requiresSubmissionCount: 0
      };
    }

    const now = new Date();

    // Resources mode
    if (mode === 'resources') {
      const completedCount = Object.values(userProgress).filter(p => p.completed).length;
      const requiredCount = items.filter(r => !r.optional).length;
      const optionalCount = items.filter(r => r.optional).length;
      const pendingCount = items.filter(r => {
        const rid = r.docId || r.id;
        return !userProgress[rid]?.completed;
      }).length;
      const overdueCount = items.filter(r => {
        if (!r.dueDate) return false;
        const dueDate = r.dueDate?.seconds ? new Date(r.dueDate.seconds * 1000) : new Date(r.dueDate);
        const rid = r.docId || r.id;
        return dueDate < now && !userProgress[rid]?.completed;
      }).length;
      const requiresSubmissionCount = items.filter(r => r.requiresSubmission === true).length;
      
      return {
        completedCount,
        pendingCount,
        requiredCount,
        optionalCount,
        overdueCount,
        requiresSubmissionCount
      };
    }

    // Quiz mode
    if (mode === 'activities' && activityType === 'quiz') {
      const totalCount = items.length;
      const completedCount = 0; // Would need submission data
      const pendingCount = totalCount;
      const requiredCount = totalCount;
      const optionalCount = 0;
      const overdueCount = 0;
      const requiresSubmissionCount = items.filter(q => q.requiresSubmission === true).length;
      
      return {
        completedCount,
        pendingCount,
        requiredCount,
        optionalCount,
        overdueCount,
        requiresSubmissionCount
      };
    }

    // Activities mode (default)
    const completedCount = items.filter(a => {
      const aid = a.docId || a.id;
      return submissions[aid]?.status === 'graded' || submissions[aid]?.status === 'completed';
    }).length;
    
    const pendingCount = items.filter(a => {
      const aid = a.docId || a.id;
      return !submissions[aid] || (submissions[aid]?.status !== 'graded' && submissions[aid]?.status !== 'completed');
    }).length;
    
    const overdueCount = items.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = a.dueDate?.seconds ? new Date(a.dueDate.seconds * 1000) : new Date(a.dueDate);
      const aid = a.docId || a.id;
      return dueDate < now && submissions[aid]?.status !== 'graded' && submissions[aid]?.status !== 'completed';
    }).length;
    
    const optionalCount = items.filter(a => a.optional).length;
    const requiredCount = items.filter(a => !a.optional).length;
    const requiresSubmissionCount = items.filter(a => a.requiresSubmission === true).length;
    
    return {
      completedCount,
      pendingCount,
      requiredCount,
      optionalCount,
      overdueCount,
      requiresSubmissionCount
    };
  }, [items, mode, userProgress, submissions, activityType]);
};

/**
 * Custom hook to calculate filter counts for submissions (ReviewResultsPage)
 * 
 * @param {Array} submissions - Array of submissions
 * @returns {Object} Filter counts object
 */
export const useSubmissionFilterCounts = (submissions) => {
  return useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return {
        completedCount: 0,
        pendingCount: 0,
        requiredCount: 0,
        optionalCount: 0,
        overdueCount: 0,
        requiresSubmissionCount: 0
      };
    }

    const now = new Date();
    
    return {
      completedCount: submissions.filter(s => s.status === 'completed').length,
      pendingCount: submissions.filter(s => s.status === 'pending').length,
      requiredCount: submissions.filter(s => s.isRequired === true).length,
      optionalCount: submissions.filter(s => s.isRequired === false).length,
      overdueCount: submissions.filter(s => {
        const dueDate = new Date(s.dueDate);
        return dueDate < now && s.status !== 'completed';
      }).length,
      requiresSubmissionCount: submissions.filter(s => s.requiresSubmission === true).length
    };
  }, [submissions]);
};

export default useFilterCounts;
