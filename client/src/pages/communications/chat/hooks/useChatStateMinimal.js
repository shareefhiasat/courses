/**
 * Minimal Chat State Hook
 * A lightweight version of useChatState for gradual migration
 * Works alongside existing state without breaking changes
 */

import { useState, useCallback, useMemo } from 'react';

import { info, error, warn, debug } from '@services/utils/logger.js';import { 
  LOCAL_STORAGE_KEYS, 
  SIDEBAR_CONFIG,
  CHAT_TYPES
} from '../constants/chatConstants';

export const useChatStateMinimal = (user) => {
  // Basic state - start with just a few key variables
  const [showMembersMinimal, setShowMembersMinimal] = useState(false);
  const [selectedClassMinimal, setSelectedClassMinimal] = useState(CHAT_TYPES.GLOBAL);
  const [sidebarWidthMinimal, setSidebarWidthMinimal] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.SIDEBAR_WIDTH) || '0', 10);
      return Number.isFinite(saved) && saved >= SIDEBAR_CONFIG.MIN_WIDTH && saved <= SIDEBAR_CONFIG.MAX_WIDTH 
        ? saved 
        : SIDEBAR_CONFIG.DEFAULT_WIDTH;
    } catch {
      return SIDEBAR_CONFIG.DEFAULT_WIDTH;
    }
  });

  // Safe computed values
  const chatTypeMinimal = useMemo(() => {
    if (selectedClassMinimal === CHAT_TYPES.GLOBAL) return 'global';
    if (selectedClassMinimal?.startsWith('dm:')) return 'dm';
    return 'class';
  }, [selectedClassMinimal]);

  const chatIdMinimal = useMemo(() => {
    if (selectedClassMinimal === CHAT_TYPES.GLOBAL) return 'global';
    if (selectedClassMinimal?.startsWith('dm:')) return selectedClassMinimal.slice(3);
    return selectedClassMinimal;
  }, [selectedClassMinimal]);

  // Actions
  const toggleShowMembersMinimal = useCallback(() => {
    setShowMembersMinimal(prev => !prev);
  }, []);

  const handleClassChangeMinimal = useCallback((classId) => {
    setSelectedClassMinimal(classId);
  }, []);

  // Reset function
  const resetMinimalState = useCallback(() => {
    setShowMembersMinimal(false);
    setSelectedClassMinimal(CHAT_TYPES.GLOBAL);
  }, []);

  return {
    // State
    showMembersMinimal,
    selectedClassMinimal,
    sidebarWidthMinimal,
    
    // Computed
    chatTypeMinimal,
    chatIdMinimal,
    
    // Actions
    setShowMembersMinimal,
    setSelectedClassMinimal,
    setSidebarWidthMinimal,
    toggleShowMembersMinimal,
    handleClassChangeMinimal,
    resetMinimalState,
    
    // Metadata
    isMinimal: true,
    version: '1.0.0'
  };
};

export default useChatStateMinimal;
