/**
 * Participant Management Modal
 * 
 * Modal for managing group chat participants (creator only)
 */

import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { apiService } from '@services/api/apiService';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './ParticipantManagementModal.module.css';

const ParticipantManagementModal = ({ isOpen, onClose, room, currentUserId, onParticipantsChanged }) => {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();

  const [participants, setParticipants] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const isCreator = room?.createdBy === currentUserId;

  useEffect(() => {
    if (isOpen && room) {
      setParticipants(room.participants || []);
      if (isCreator) {
        loadAvailableUsers();
      }
    }
  }, [isOpen, room, isCreator]);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/chat/users');
      if (response?.data) {
        // Filter out users who are already participants
        const participantIds = new Set((room.participants || []).map(p => p.userId));
        const available = response.data.filter(user => !participantIds.has(user.id));
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error(t('chat_error_loading_users'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async (user) => {
    try {
      setActionLoading(`add-${user.id}`);
      const response = await apiService.post(`/chat/rooms/${room.id}/participants`, {
        userId: user.id
      });

      if (response?.success) {
        toast.success(t('chat_participant_added'));
        // Update local state
        setParticipants(prev => [...prev, response.data]);
        setAvailableUsers(prev => prev.filter(u => u.id !== user.id));
        onParticipantsChanged?.();
      }
    } catch (error) {
      console.error('Failed to add participant:', error);
      toast.error(t('chat_error_adding_participant'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveParticipant = async (participant) => {
    if (participant.userId === room.createdBy) {
      toast.error(t('chat_cannot_remove_creator'));
      return;
    }

    try {
      setActionLoading(`remove-${participant.userId}`);
      const response = await apiService.delete(`/chat/rooms/${room.id}/participants/${participant.userId}`);

      if (response?.success) {
        toast.success(t('chat_participant_removed'));
        // Update local state
        setParticipants(prev => prev.filter(p => p.userId !== participant.userId));
        if (participant.user) {
          setAvailableUsers(prev => [...prev, participant.user]);
        }
        onParticipantsChanged?.();
      }
    } catch (error) {
      console.error('Failed to remove participant:', error);
      toast.error(t('chat_error_removing_participant'));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAvailableUsers = availableUsers.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  if (!isOpen || !room) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.modal} ${isRTL ? styles.rtl : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            {getThemedIcon('ui', 'users', 24, theme)}
            <h2>{t('chat_manage_participants')}</h2>
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            {getThemedIcon('ui', 'x', 20, theme)}
          </button>
        </div>

        <div className={styles.content}>
          {/* Current Participants */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {t('chat_current_participants')} ({participants.length})
            </h3>
            <div className={styles.participantList}>
              {participants.map(participant => {
                const user = participant.user;
                const isRoomCreator = participant.userId === room.createdBy;
                const isLoading = actionLoading === `remove-${participant.userId}`;
                
                return (
                  <div key={participant.id} className={styles.participantItem}>
                    <div className={styles.userInfo}>
                      {user?.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt={user.displayName}
                          className={styles.userAvatar}
                        />
                      ) : (
                        <div className={styles.userAvatarPlaceholder}>
                          {(user?.displayName || user?.firstName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>
                          {user?.displayName || `${user?.firstName} ${user?.lastName}`}
                          {isRoomCreator && (
                            <span className={styles.creatorBadge}>
                              {getThemedIcon('ui', 'crown', 14, theme)}
                              {t('chat_creator')}
                            </span>
                          )}
                        </div>
                        {user?.email && (
                          <div className={styles.userEmail}>{user.email}</div>
                        )}
                      </div>
                    </div>
                    {isCreator && !isRoomCreator && (
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveParticipant(participant)}
                        disabled={isLoading}
                      >
                        {isLoading ? t('removing') : getThemedIcon('ui', 'x', 18, theme)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Participants (Creator Only) */}
          {isCreator && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('chat_add_participants')}</h3>
              
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>{getThemedIcon('ui', 'search', 18, theme)}</span>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('chat_search_users')}
                />
              </div>

              <div className={styles.availableUserList}>
                {loading ? (
                  <div className={styles.loading}>{t('loading')}</div>
                ) : filteredAvailableUsers.length === 0 ? (
                  <div className={styles.empty}>
                    {searchQuery ? t('chat_no_users_found') : t('chat_all_users_added')}
                  </div>
                ) : (
                  filteredAvailableUsers.map(user => {
                    const isLoading = actionLoading === `add-${user.id}`;
                    return (
                      <div key={user.id} className={styles.availableUserItem}>
                        <div className={styles.userInfo}>
                          {user.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl} 
                              alt={user.displayName}
                              className={styles.userAvatar}
                            />
                          ) : (
                            <div className={styles.userAvatarPlaceholder}>
                              {(user.displayName || user.firstName || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div className={styles.userDetails}>
                            <div className={styles.userName}>
                              {user.displayName || `${user.firstName} ${user.lastName}`}
                            </div>
                            {user.email && (
                              <div className={styles.userEmail}>{user.email}</div>
                            )}
                          </div>
                        </div>
                        <button
                          className={styles.addButton}
                          onClick={() => handleAddParticipant(user)}
                          disabled={isLoading}
                        >
                          {isLoading ? t('adding') : getThemedIcon('ui', 'plus', 18, theme)}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.closeFooterButton}
            onClick={onClose}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantManagementModal;
