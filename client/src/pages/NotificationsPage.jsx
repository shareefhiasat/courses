import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Bell, Check, Trash2, Mail, MessageCircle, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import { Container, Card, CardBody, Button, SearchBar, Badge, Spinner, EmptyState } from '../components/ui';
import { formatDateTime } from '../utils/date';
import styles from './NotificationsPage.module.css';

const NotificationsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!user?.uid) return;

    const notifRef = collection(db, 'notifications');
    const q = query(
      notifRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const markAsRead = async (notifId) => {
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadNotifs = notifications.filter(n => !n.read);
      
      unreadNotifs.forEach(notif => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notifId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    if (!window.confirm(t('are_you_sure_clear_all'))) return;
    
    try {
      const batch = writeBatch(db);
      notifications.forEach(notif => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.delete(notifRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const filteredNotifications = notifications
    .filter(notif => {
      if (filterType === 'unread' && notif.read) return false;
      if (filterType === 'read' && !notif.read) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = (notif.title || '').toLowerCase();
        const message = (notif.message || '').toLowerCase();
        return title.includes(query) || message.includes(query);
      }
      
      return true;
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
    });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (authLoading || loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;

  return (
    <Container maxWidth="lg" className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <Bell size={28} />
            <h1>{t('notifications')}</h1>
            {unreadCount > 0 && (
              <Badge color="danger">{unreadCount}</Badge>
            )}
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={<Check size={18} />}
                onClick={markAllAsRead}
              >
                {t('mark_all_read')}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={18} />}
                onClick={clearAll}
              >
                {t('clear_all')}
              </Button>
            )}
          </div>
        </div>

        <div className={styles.searchFilterBar}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('search_notifications') || 'Search notifications...'}
            fullWidth
          />
        </div>

        <div className={styles.chipRow}>
          <div className={styles.statusChips}>
            <Button
              variant={filterType === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              {t('all')}
            </Button>
            <Button
              variant={filterType === 'unread' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('unread')}
            >
              {t('unread') || 'Unread'}
            </Button>
            <Button
              variant={filterType === 'read' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('read')}
            >
              {t('read') || 'Read'}
            </Button>
          </div>

          <button
            type="button"
            className={styles.sortChip}
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
          >
            {sortBy === 'newest' ? (
              <>
                <ArrowDownWideNarrow size={16} />
                <span>{t('newest_first') || 'Newest'}</span>
              </>
            ) : (
              <>
                <ArrowUpWideNarrow size={16} />
                <span>{t('oldest_first') || 'Oldest'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={searchQuery ? t('no_results') || 'No results found' : t('no_notifications_yet')}
            description={
              searchQuery 
                ? t('try_different_search') || 'Try a different search term'
                : t('notifications_appear_here') || 'Your notifications will appear here'
            }
          />
        ) : (
          filteredNotifications.map(notif => (
            <Card
              key={notif.id}
              className={`${styles.notificationItem} ${notif.read ? styles.read : styles.unread}`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <CardBody>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <div className={styles.notificationTitleRow}>
                      <span className={`${styles.readDot} ${notif.read ? styles.readDotRead : styles.readDotUnread}`} />
                      <span className={styles.typeIcon}>
                        {notif.type === 'chat' ? (
                          <MessageCircle size={16} />
                        ) : notif.type === 'email' || notif.type === 'newsletter' ? (
                          <Mail size={16} />
                        ) : (
                          <Bell size={16} />
                        )}
                      </span>
                      <h3>{notif.title || t('notification')}</h3>
                    </div>
                    <span className={styles.notificationTime}>
                      {formatDateTime(notif.createdAt?.toDate?.())}
                    </span>
                  </div>
                  <p className={styles.notificationMessage}>{notif.message}</p>
                  {notif.link && (
                    <a href={notif.link} className={styles.notificationLink}>
                      {t('view_details') || 'View Details'} →
                    </a>
                  )}
                </div>
                <div className={styles.notificationActions}>
                  {!notif.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Check size={18} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                      title={t('mark_as_read') || 'Mark as read'}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={18} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    title={t('delete')}
                    className={styles.dangerButton}
                  />
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
};

export default NotificationsPage;
