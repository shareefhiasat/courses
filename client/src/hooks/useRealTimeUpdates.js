import { useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastProvider';

export const useRealTimeUpdates = () => {
  const { user } = useAuth();
  const toast = useToast();
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!user) return;

    // Real-time announcements listener - simplified to avoid infinite notifications
    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(1) // Only get the latest announcement
    );

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      // Skip initial load to prevent showing notifications for existing data
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const announcement = change.doc.data();
          toast?.showSuccess(`📢 New Announcement: ${announcement.title}`);
        }
      });
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
