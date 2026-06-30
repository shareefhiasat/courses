/**
 * Participant Management Modal
 * 
 * Modal for managing group chat participants (creator only)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { apiService } from '@services/api/apiService';
import { chatService } from '@services/business/chatService';
import { getThemedIcon, getIconWithColor, getUserRoleColor } from '@constants/iconTypes';
import { getChatUserDisplayName, resolveUserRole } from '@utils/userUtils';
import RoleBadge from './RoleBadge';
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
  const [roleFilter, setRoleFilter] = useState(null);

  const isCreator = room?.createdBy === currentUserId;
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current && room) {
      setParticipants(room.participants || []);
      setRoleFilter(null);
      setSearchQuery('');
      if (isCreator) {
        loadAvailableUsers();
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, room, isCreator]);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/chat/users');
      if (response?.data) {
        // Filter out users who are already participants (use current state)
        const participantIds = new Set(participants.map(p => p.userId));
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

  const handleAssignAdmin = async (participant) => {
    if (!confirm(t('chat_assign_admin_confirm') || 'Are you sure you want to make this user the new admin? You will lose your admin privileges.')) return;
    try {
      setActionLoading(`admin-${participant.userId}`);
      const result = await chatService.assignGroupAdmin(room.id, participant.userId);
      if (result.success) {
        toast.success(t('chat_admin_assigned') || 'Admin assigned successfully');
        onParticipantsChanged?.();
        onClose();
      } else {
        toast.error(result.error || t('chat_assign_admin_failed') || 'Failed to assign admin');
      }
    } catch (error) {
      console.error('Failed to assign admin:', error);
      toast.error(t('chat_assign_admin_failed') || 'Failed to assign admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm(t('chat_leave_group_confirm'))) return;
    try {
      setActionLoading('leave');
      const response = await apiService.delete(`/chat/rooms/${room.id}/participants/${currentUserId}`);
      if (response?.success) {
        toast.success(t('chat_left_group'));
        onParticipantsChanged?.();
        onClose();
      } else {
        toast.error(t('chat_leave_group_failed'));
      }
    } catch (err) {
      console.error('Failed to leave group:', err);
      toast.error(t('chat_leave_group_failed'));
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
  }).filter(user => {
    if (!roleFilter) return true;
    return resolveUserRole(user) === roleFilter;
  });

  const filteredParticipants = participants.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const user = p.user;
    return (
      user?.displayName?.toLowerCase().includes(query) ||
      user?.firstName?.toLowerCase().includes(query) ||
      user?.lastName?.toLowerCase().includes(query) ||
      user?.email?.toLowerCase().includes(query)
    );
  }).filter(p => {
    if (!roleFilter) return true;
    return resolveUserRole(p.user) === roleFilter;
  });

  const ROLE_CHIPS = [
    { key: 'all', label: t('chat_all'), icon: null, color: null },
    { key: 'student', label: t('chat_filter_students'), icon: 'student', color: getUserRoleColor('student') },
    { key: 'instructor', label: t('chat_filter_instructors'), icon: 'instructor', color: getUserRoleColor('instructor') },
    { key: 'admin', label: t('chat_filter_admins'), icon: 'admin', color: getUserRoleColor('admin') },
    { key: 'hr', label: t('chat_filter_hr'), icon: 'hr', color: getUserRoleColor('hr') },
  ];

  if (!isOpen || !room) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.drawer} ${isRTL ? styles.rtl : ''}`}
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
          {/* Role Filter Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
            {ROLE_CHIPS.map(chip => {
              const isActive = (chip.key === 'all' && !roleFilter) || roleFilter === chip.key;
              const chipColor = chip.color || '#6b7280';
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setRoleFilter(chip.key === 'all' ? null : chip.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '3px 10px',
                    borderRadius: 12,
                    border: `1px solid ${isActive ? chipColor : 'var(--border)'}`,
                    background: isActive ? `${chipColor}15` : 'transparent',
                    color: isActive ? chipColor : 'var(--text)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {chip.icon && getIconWithColor('user_role', chip.icon, 12, isActive ? chipColor : '#9ca3af')}
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className={styles.searchBox} style={{ marginBottom: '0.75rem' }}>
            <span className={styles.searchIcon}>{getThemedIcon('ui', 'search', 18, theme)}</span>
            <input
              type="text"
              autoComplete="off"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('chat_search_users')}
            />
          </div>

          {/* Current Participants */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} style={{ fontSize: '0.85rem' }}>
              {t('chat_current_participants')} ({filteredParticipants.length}/{participants.length})
            </h3>
            <div className={styles.participantList}>
              {filteredParticipants.map(participant => {
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
                          <RoleBadge user={user} size={12} fontSize="0.7rem" />
                          {getChatUserDisplayName(user)}
                          {isRoomCreator && (
                            <span className={styles.creatorBadge}>
                              {getIconWithColor('ui', 'crown', 14, '#ffc107')}
                              {t('chat_creator')}
                            </span>
                          )}
                        </div>
                        {user?.email && (
                          <div className={styles.userEmail}>{user.email}</div>
                        )}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                          {(user?._count?.enrollments !== undefined || user?.enrollmentCount !== undefined) && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--bg)', padding: '1px 8px', borderRadius: 10, border: '1px solid var(--border)' }}>
                              {getThemedIcon('ui', 'book_open', 10, theme)}
                              {(user?._count?.enrollments ?? user?.enrollmentCount ?? 0)} {t('classes') || 'classes'}
                            </span>
                          )}
                          {(user?._count?.chatRoomParticipations !== undefined || user?.groupCount !== undefined) && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--bg)', padding: '1px 8px', borderRadius: 10, border: '1px solid var(--border)' }}>
                              {getThemedIcon('ui', 'users', 10, theme)}
                              {(user?._count?.chatRoomParticipations ?? user?.groupCount ?? 0)} {t('groups') || 'groups'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isCreator && !isRoomCreator && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          className={styles.addButton}
                          onClick={() => handleAssignAdmin(participant)}
                          disabled={actionLoading === `admin-${participant.userId}`}
                          title={t('chat_assign_admin') || 'Assign as Admin'}
                          style={{ color: '#ffc107' }}
                        >
                          {actionLoading === `admin-${participant.userId}` ? t('saving') : getIconWithColor('ui', 'crown', 16, '#ffc107')}
                        </button>
                        <button
                          className={styles.removeButton}
                          onClick={() => handleRemoveParticipant(participant)}
                          disabled={isLoading}
                        >
                          {isLoading ? t('removing') : getThemedIcon('ui', 'x', 18, theme)}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredParticipants.length === 0 && participants.length > 0 && (
                <div className={styles.empty}>{t('chat_no_users_found')}</div>
              )}
              {participants.length === 0 && (
                <div className={styles.empty}>{t('chat_no_participants')}</div>
              )}
            </div>
          </div>

          {/* Add Participants (Creator Only) */}
          {isCreator && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle} style={{ fontSize: '0.85rem' }}>{t('chat_add_participants')}</h3>

              <div className={styles.availableUserList}>
                {loading ? (
                  <div className={styles.loading}>{t('loading')}</div>
                ) : filteredAvailableUsers.length === 0 ? (
                  <div className={styles.empty}>
                    {searchQuery || roleFilter ? t('chat_no_users_found') : t('chat_all_users_added')}
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
                              <RoleBadge user={user} size={12} fontSize="0.7rem" />
                              {getChatUserDisplayName(user)}
                            </div>
                            {user.email && (
                              <div className={styles.userEmail}>{user.email}</div>
                            )}
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                              {(user?._count?.enrollments !== undefined || user?.enrollmentCount !== undefined) && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--bg)', padding: '1px 8px', borderRadius: 10, border: '1px solid var(--border)' }}>
                                  {getThemedIcon('ui', 'book_open', 10, theme)}
                                  {(user?._count?.enrollments ?? user?.enrollmentCount ?? 0)} {t('classes') || 'classes'}
                                </span>
                              )}
                              {(user?._count?.chatRoomParticipations !== undefined || user?.groupCount !== undefined) && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--bg)', padding: '1px 8px', borderRadius: 10, border: '1px solid var(--border)' }}>
                                  {getThemedIcon('ui', 'users', 10, theme)}
                                  {(user?._count?.chatRoomParticipations ?? user?.groupCount ?? 0)} {t('groups') || 'groups'}
                                </span>
                              )}
                            </div>
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
          {!isCreator && (
            <button
              className={styles.leaveButton}
              onClick={handleLeaveGroup}
              disabled={actionLoading === 'leave'}
            >
              {actionLoading === 'leave' ? t('leaving') : t('chat_leave_group')}
            </button>
          )}
          {isCreator && (
            <button
              className={styles.leaveButton}
              onClick={handleLeaveGroup}
              disabled={actionLoading === 'leave'}
            >
              {actionLoading === 'leave' ? t('leaving') : t('chat_leave_group')}
            </button>
          )}
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
