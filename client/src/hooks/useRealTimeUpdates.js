import { useEffect, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { onLatestAnnouncementChange } from '@services/db/announcementDbService';


import { info, error, warn, debug } from '@services/utils/logger.js';export const useRealTimeUpdates = () => {
  const { user } = useAuth();
  const toast = useToast();
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!user) return;

    // Real-time announcements listener using centralized service
    const unsubscribeAnnouncements = onLatestAnnouncementChange((announcement, changeType) => {
      // Skip initial load to prevent showing notifications for existing data
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        return;
      }

      if (changeType === 'added') {
        toast?.showSuccess(`📢 New Announcement: ${announcement.title}`);
      }
    });

    // Simplified notifications - remove complex query that needs indexes
    // We'll handle this differently or create the required indexes

    // Cleanup listeners on unmount
    return () => {
      unsubscribeAnnouncements();
    };
  }, [user, toast]);
};

export default useRealTimeUpdates;

