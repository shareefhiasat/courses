import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Bell, Search, Check, Trash2, Filter, X } from 'lucide-react';
import Loading from '../components/Loading';
import { formatDateTime } from '../utils/date';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unread, read
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest
  const [showFilters, setShowFilters] = useState(false);

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

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notif => {
      // Filter by read/unread
      if (filterType === 'unread' && notif.read) return false;
      if (filterType === 'read' && !notif.read) return false;
      
      // Filter by search query
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

  if (authLoading || loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-top">
          <div className="header-title">
            <Bell size={28} />
            <h1>{t('notifications')}</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="btn-secondary">
                <Check size={18} />
                {t('mark_all_read')}
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} className="btn-danger">
                <Trash2 size={18} />
                {t('clear_all')}
              </button>
            )}
          </div>
        </div>

        <div className="search-filter-bar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder={t('search_notifications') || 'Search notifications...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-search">
                <X size={18} />
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
          >
            <Filter size={20} />
            {t('filter') || 'Filter'}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>{t('status') || 'Status'}:</label>
              <div className="filter-options">
                <button
                  className={filterType === 'all' ? 'active' : ''}
                  onClick={() => setFilterType('all')}
                >
                  {t('all')}
                </button>
                <button
                  className={filterType === 'unread' ? 'active' : ''}
                  onClick={() => setFilterType('unread')}
                >
                  {t('unread') || 'Unread'}
                </button>
                <button
                  className={filterType === 'read' ? 'active' : ''}
                  onClick={() => setFilterType('read')}
                >
                  {t('read') || 'Read'}
                </button>
              </div>
            </div>

            <div className="filter-group">
              <label>{t('sort_by') || 'Sort by'}:</label>
              <div className="filter-options">
                <button
                  className={sortBy === 'newest' ? 'active' : ''}
                  onClick={() => setSortBy('newest')}
                >
                  {t('newest_first') || 'Newest First'}
                </button>
                <button
                  className={sortBy === 'oldest' ? 'active' : ''}
                  onClick={() => setSortBy('oldest')}
                >
                  {t('oldest_first') || 'Oldest First'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={64} />
            <h2>{searchQuery ? t('no_results') || 'No results found' : t('no_notifications_yet')}</h2>
            <p>
              {searchQuery 
                ? t('try_different_search') || 'Try a different search term'
                : t('notifications_appear_here') || 'Your notifications will appear here'
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              className={`notification-item ${notif.read ? 'read' : 'unread'}`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notif.title || t('notification')}</h3>
                  <span className="notification-time">
                    {formatDateTime(notif.createdAt?.toDate?.())}
                  </span>
                </div>
                <p className="notification-message">{notif.message}</p>
                {notif.link && (
                  <a href={notif.link} className="notification-link">
                    {t('view_details') || 'View Details'} →
                  </a>
                )}
              </div>
              <div className="notification-actions">
                {!notif.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notif.id);
                    }}
                    className="btn-icon"
                    title={t('mark_as_read') || 'Mark as read'}
                  >
                    <Check size={18} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="btn-icon btn-danger"
                  title={t('delete')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
