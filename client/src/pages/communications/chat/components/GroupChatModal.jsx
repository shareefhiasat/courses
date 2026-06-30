/**
 * Group Chat Modal
 * 
 * Modal for creating new group chats (staff only)
 */

import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { apiService } from '@services/api/apiService';
import { getThemedIcon, getIconWithColor, getUserRoleColor } from '@constants/iconTypes';
import { resolveUserRole, getChatUserDisplayName } from '@utils/userUtils';
import RoleBadge from './RoleBadge';
import styles from './GroupChatModal.module.css';

const GroupChatModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();

  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [roleFilter, setRoleFilter] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    } else {
      // Reset form when modal closes
      setGroupName('');
      setSearchQuery('');
      setSelectedUsers([]);
      setRoleFilter(null);
    }
  }, [isOpen]);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/chat/users');
      if (response?.data) {
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error(t('chat_error_loading_users'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error(t('chat_group_name_required'));
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error(t('chat_group_participants_required'));
      return;
    }

    try {
      setCreating(true);
      const response = await apiService.post('/chat/rooms/group', {
        name: groupName.trim(),
        participantIds: selectedUsers.map(u => u.id)
      });

      if (response?.success) {
        toast.success(t('chat_group_created'));
        await onGroupCreated?.(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      if (error.response?.status === 403) {
        toast.error(t('chat_group_staff_only'));
      } else {
        toast.error(t('chat_error_creating_group'));
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const filteredUsers = availableUsers.filter(user => {
    if (roleFilter && resolveUserRole(user) !== roleFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.drawer} ${isRTL ? styles.rtl : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            {getThemedIcon('ui', 'users', 24, theme)}
            <h2>{t('chat_create_group')}</h2>
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={creating}
          >
            {getThemedIcon('ui', 'x', 20, theme)}
          </button>
        </div>

        <div className={styles.content}>
          {/* Group Name Input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t('chat_group_name')} <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              autoComplete="off"
              className={styles.input}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('chat_group_name_placeholder')}
              maxLength={100}
              disabled={creating}
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className={styles.selectedUsers}>
              <label className={styles.label}>
                {t('chat_selected_participants')} ({selectedUsers.length})
              </label>
              <div className={styles.selectedUsersList}>
                {selectedUsers.map(user => {
                  const role = resolveUserRole(user);
                  const roleColor = getUserRoleColor(role);
                  return (
                    <div key={user.id} className={styles.selectedUserChip} style={{ borderColor: roleColor, color: roleColor, background: `${roleColor}15` }}>
                      {role && getIconWithColor('user_role', role, 12, roleColor)}
                      <span>{getChatUserDisplayName(user)}</span>
                      <button
                        className={styles.removeChipButton}
                        onClick={() => toggleUserSelection(user)}
                        disabled={creating}
                        style={{ color: roleColor }}
                      >
                        {getThemedIcon('ui', 'x', 12, theme)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role Filter Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
            {[{ key: 'all', label: t('chat_all'), icon: null, color: null },
              { key: 'student', label: t('chat_filter_students'), icon: 'student', color: getUserRoleColor('student') },
              { key: 'instructor', label: t('chat_filter_instructors'), icon: 'instructor', color: getUserRoleColor('instructor') },
              { key: 'admin', label: t('chat_filter_admins'), icon: 'admin', color: getUserRoleColor('admin') },
              { key: 'hr', label: t('chat_filter_hr'), icon: 'hr', color: getUserRoleColor('hr') },
            ].map(chip => {
              const isActive = (chip.key === 'all' && !roleFilter) || roleFilter === chip.key;
              const chipColor = chip.color || '#6b7280';
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setRoleFilter(chip.key === 'all' ? null : chip.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '3px 10px', borderRadius: 12,
                    border: `1px solid ${isActive ? chipColor : 'var(--border)'}`,
                    background: isActive ? `${chipColor}15` : 'transparent',
                    color: isActive ? chipColor : 'var(--text)',
                    fontSize: 'var(--font-size-xs)', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  {chip.icon && getIconWithColor('user_role', chip.icon, 12, isActive ? chipColor : '#9ca3af')}
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* User Search */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t('chat_add_participants')} <span className={styles.required}>*</span>
            </label>
            <div className={styles.searchBox}>
              <input
                type="text"
                autoComplete="off"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('chat_search_users')}
                disabled={creating}
              />
            </div>
          </div>

          {/* User List */}
          <div className={styles.userList}>
            {loading ? (
              <div className={styles.loading}>{t('loading')}</div>
            ) : filteredUsers.length === 0 ? (
              <div className={styles.empty}>{t('chat_no_users_found')}</div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUsers.some(u => u.id === user.id);
                const role = resolveUserRole(user);
                const isInactive = user.isActive === false;
                return (
                  <div
                    key={user.id}
                    className={`${styles.userItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => !creating && toggleUserSelection(user)}
                    style={isInactive ? { opacity: 0.5 } : undefined}
                  >
                    <div className={styles.userInfo}>
                      {user.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt={user.displayName}
                          className={styles.userAvatar}
                        />
                      ) : (
                        <div className={styles.userAvatarPlaceholder} style={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                          {(user.displayName || user.firstName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className={styles.userDetails} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                        {(() => {
                          if (!role) return null;
                          return (
                            <RoleBadge user={user} size={10} />
                          );
                        })()}
                        {role === 'student' && user.enrollmentCount > 0 && (
                          <span title={t('enrolled_classes')} style={{ fontSize: '0.65rem', background: 'var(--bg)', color: 'var(--muted)', padding: '1px 5px', borderRadius: 8, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {user.enrollmentCount} {t('classes')}
                          </span>
                        )}
                        {role === 'instructor' && user.classCount > 0 && (
                          <span title={t('teaching_classes')} style={{ fontSize: '0.65rem', background: 'var(--bg)', color: 'var(--muted)', padding: '1px 5px', borderRadius: 8, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {user.classCount} {t('classes')}
                          </span>
                        )}
                        <span className={styles.userName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '0 1 auto' }}>
                          {getChatUserDisplayName(user)}
                        </span>
                        {isInactive && (
                          <span title={t('inactive_user')} style={{ fontSize: '0.65rem', background: '#dc2626', color: 'white', padding: '1px 5px', borderRadius: 8, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {t('inactive')}
                          </span>
                        )}
                        {user.email && (
                          <span className={styles.userEmail} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{user.email}</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className={styles.checkmark}>
                        {getThemedIcon('ui', 'check', 16, theme)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={creating}
          >
            {t('cancel')}
          </button>
          <button
            className={styles.createButton}
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
          >
            {creating ? t('creating') : t('chat_create_group_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatModal;
