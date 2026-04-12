import { useMemo } from 'react';
import { calculateBookmarkCount } from '@services/business/bookmarkService';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Custom hook to calculate filter counts for status filters
 * Encapsulates the filter count logic to reduce prop drilling
 * 
 * @param {Array} items - Array of items to count (activities, resources, submissions, etc.)
 * @param {Object} options - Configuration options
 * @param {string} options.mode - Current mode ('activities', 'resources', 'quiz')
 * @param {Object} options.userProgress - User progress data (for resources)
 * @param {Object} options.submissions - Submissions data (for activities)
 * @param {Object} options.bookmarks - Bookmarks data (for bookmark counting)
 * @param {string} options.activityType - Activity type (for activities mode)
 * @returns {Object} Filter counts object
 */
export const useFilterCounts = (items, options = {}) => {
  const {
    mode = 'activities',
    userProgress = {},
    submissions = {},
    bookmarks = {},
    activityType = 'all'
  } = options;

  return useMemo(() => {
    if (!items || items.length === 0) {
      return {
        bookmark: 0, // Add bookmark count
        featured: 0, // Add featured count
        retakable: 0, // Add retakable count
        completedCount: 0,
        pendingCount: 0,
        requiredCount: 0,
        optionalCount: 0,
        overdueCount: 0,
        requiresSubmissionCount: 0,
        beginner: 0, // Add difficulty counts
        intermediate: 0,
        advanced: 0
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
      const bookmark = calculateBookmarkCount(items, bookmarks, mode, activityType);
      
      // Calculate additional counts from item properties
      const featured = items.filter(r => r.featured).length;
      const retakable = items.filter(r => r.allowRetake || r.settings?.allowRetake).length;
      const beginner = items.filter(r => r.difficulty === 'beginner').length;
      const intermediate = items.filter(r => r.difficulty === 'intermediate').length;
      const advanced = items.filter(r => r.difficulty === 'advanced').length;
      
      return {
        bookmark,
        featured,
        retakable,
        completedCount,
        pendingCount,
        requiredCount,
        optionalCount,
        overdueCount,
        requiresSubmissionCount,
        beginner,
        intermediate,
        advanced
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
      const bookmark = calculateBookmarkCount(items, bookmarks, mode, activityType);
      
      // Calculate additional counts from item properties
      const featured = items.filter(q => q.featured).length;
      const retakable = items.filter(q => q.allowRetake || q.settings?.allowRetake).length;
      const beginner = items.filter(q => q.difficulty === 'beginner').length;
      const intermediate = items.filter(q => q.difficulty === 'intermediate').length;
      const advanced = items.filter(q => q.difficulty === 'advanced').length;
      
      return {
        bookmark,
        featured,
        retakable,
        completedCount,
        pendingCount,
        requiredCount,
        optionalCount,
        overdueCount,
        requiresSubmissionCount,
        beginner,
        intermediate,
        advanced
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
    const bookmark = calculateBookmarkCount(items, bookmarks, mode, activityType);
    
    // Calculate additional counts from item properties
    const featured = items.filter(a => a.featured).length;
    const retakable = items.filter(a => a.allowRetake || a.settings?.allowRetake).length;
    const beginner = items.filter(a => a.difficulty === 'beginner').length;
    const intermediate = items.filter(a => a.difficulty === 'intermediate').length;
    const advanced = items.filter(a => a.difficulty === 'advanced').length;
    
    return {
      bookmark,
      featured,
      retakable,
      completedCount,
      pendingCount,
      requiredCount,
      optionalCount,
      overdueCount,
      requiresSubmissionCount,
      beginner,
      intermediate,
      advanced
    };
  }, [items, mode, userProgress, submissions, bookmarks, activityType]);
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
