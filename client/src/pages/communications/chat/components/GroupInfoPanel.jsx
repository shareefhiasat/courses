/**
 * Chat Info Panel (side drawer)
 *
 * WhatsApp-style side panel showing chat stats for any room type:
 * - Created date, total messages (compact, same row)
 * - Tabs: Media, Documents, Links with search
 * - For groups: exit group, assign admin actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast, ConfirmModal } from '@ui';
import { chatService } from '@services/business/chatService';
import { getThemedIcon, getIconWithColor } from '@constants/iconTypes';
import { getChatUserDisplayName } from '@utils/userUtils';
import RoleBadge from './RoleBadge';

const TABS = [
  { key: 'media', icon: 'image', color: '#7c3aed' },
  { key: 'documents', icon: 'file', color: '#2563eb' },
  { key: 'links', icon: 'link', color: '#0891b2' },
];

const formatDate = (dateStr, lang = 'en') => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const GroupInfoPanel = ({ isOpen, onClose, roomId, roomName, isCreator, currentUser, roomType, onLeaveGroup, onAdminChanged }) => {
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('media');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, participant: null });

  const loadStats = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const result = await chatService.getRoomStats(roomId);
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('[GroupInfoPanel] Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setSearchQuery('');
    }
  }, [isOpen, loadStats]);

  const handleAssignAdmin = async (participant) => {
    try {
      setActionLoading(true);
      const result = await chatService.assignGroupAdmin(roomId, participant.userId);
      if (result.success) {
        toast.success(t('chat_admin_assigned') || 'Admin assigned successfully');
        onAdminChanged?.();
        onClose();
      } else {
        toast.error(result.error || t('chat_assign_admin_failed') || 'Failed to assign admin');
      }
    } catch (err) {
      console.error('[GroupInfoPanel] Error assigning admin:', err);
      toast.error(t('chat_assign_admin_failed') || 'Failed to assign admin');
    } finally {
      setActionLoading(false);
    }
  };

  const openAssignAdminConfirm = (participant) => {
    setConfirmModal({ isOpen: true, type: 'assign', participant });
  };

  const openLeaveGroupConfirm = () => {
    // Check if user is the creator and there are other participants
    const isCreatorOfRoom = stats && currentUser && stats.createdBy === currentUser.dbId;
    const otherParticipants = stats?.participants?.filter(p => p.userId !== currentUser?.dbId) || [];
    if (isCreatorOfRoom && otherParticipants.length > 0) {
      // Creator with other members - must assign another admin first
      setConfirmModal({ isOpen: true, type: 'leave_blocked' });
    } else {
      setConfirmModal({ isOpen: true, type: 'leave' });
    }
  };

  const handleConfirmAction = () => {
    const { type, participant } = confirmModal;
    setConfirmModal({ isOpen: false, type: null, participant: null });
    if (type === 'assign' && participant) {
      handleAssignAdmin(participant);
    } else if (type === 'leave') {
      doLeaveGroup();
    }
    // leave_blocked: just closes, no action
  };

  const handleCloseConfirm = () => {
    setConfirmModal({ isOpen: false, type: null, participant: null });
  };

  const doLeaveGroup = async () => {
    try {
      setActionLoading(true);
      const result = await chatService.leaveGroupRoom(roomId, currentUser?.dbId);
      if (result.success) {
        toast.success(t('chat_left_group'));
        onLeaveGroup?.();
        onClose();
      } else {
        toast.error(t('chat_leave_group_failed'));
      }
    } catch (err) {
      console.error('[GroupInfoPanel] Error leaving group:', err);
      toast.error(t('chat_leave_group_failed'));
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const side = isRTL ? 'left' : 'right';
  const shadowSide = isRTL ? '4px 0 24px' : '-4px 0 24px';
  const animName = isRTL ? 'slideInLeft' : 'slideInRight';
  const isGroup = roomType === 'group';

  // Filter items based on search
  const filterItems = (items) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.fileName || '').toLowerCase().includes(q) ||
      (item.url || '').toLowerCase().includes(q) ||
      (item.content || '').toLowerCase().includes(q)
    );
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          [side]: 0,
          height: '100%',
          width: '100%',
          maxWidth: 480,
          background: 'var(--panel)',
          boxShadow: `${shadowSide} rgba(0,0,0,0.2)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: `${animName} 0.25s ease-out`,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {roomName || t('chat_group_info') || 'Info'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: 'var(--muted)',
              flexShrink: 0,
              padding: '4px 8px',
              borderRadius: 6,
            }}
            title={t('close') || 'Close'}
          >
            ✕
          </button>
        </div>

        {/* Stats Summary — compact, same row */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          {/* Created date + Total messages on same row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            {getThemedIcon('ui', 'calendar', 14, theme)}
            <span>{stats ? formatDate(stats.createdAt, lang) : '...'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            {getThemedIcon('ui', 'message_square', 14, theme)}
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>
              {stats ? stats.totalMessages : '...'}
            </span>
            <span>{t('chat_total_messages') || 'messages'}</span>
          </div>
          {stats && stats.voiceCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
              {getThemedIcon('ui', 'mic', 14, theme)}
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{stats.voiceCount}</span>
            </div>
          )}
        </div>

        {/* Group Actions: Participants with assign admin, exit group */}
        {isGroup && stats && stats.participants && (
          <div style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>
              {t('chat_members') || 'Members'} ({stats.participantCount})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', maxHeight: 280, overflowY: 'auto' }}>
              {stats.participants.map((p, idx) => {
                const isRoomCreator = p.userId === stats.createdBy;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: idx < stats.participants.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      {p.user?.profileImageUrl ? (
                        <img src={p.user.profileImageUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600, flexShrink: 0 }}>
                          {(p.user?.displayName || p.user?.firstName || 'U')[0]?.toUpperCase()}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <RoleBadge user={p.user} size={12} fontSize="0.7rem" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getChatUserDisplayName(p.user)}
                          </span>
                          {isRoomCreator && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', background: 'rgba(255, 193, 7, 0.12)', color: '#ffc107', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                              {getIconWithColor('ui', 'crown', 14, '#ffc107')}
                              {t('chat_creator') || 'Creator'}
                            </span>
                          )}
                        </div>
                        {p.user?.email && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.user.email}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                          {(p.user?._count?.enrollments !== undefined) && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--panel)', padding: '1px 8px', borderRadius: 10, border: '1px solid var(--border)' }}>
                              {getThemedIcon('ui', 'book_open', 10, theme)}
                              {p.user._count.enrollments} {t('classes') || 'classes'}
                            </span>
                          )}
                          {(p.user?._count?.chatRoomParticipations !== undefined) && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--panel)', padding: '1px 8px', borderRadius: 10, border: '1px solid var(--border)' }}>
                              {getThemedIcon('ui', 'users', 10, theme)}
                              {p.user._count.chatRoomParticipations} {t('groups') || 'groups'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isCreator && !isRoomCreator && (
                      <button
                        onClick={() => openAssignAdminConfirm(p)}
                        disabled={actionLoading}
                        title={t('chat_assign_admin') || 'Assign as Admin'}
                        style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, flexShrink: 0, color: '#ffc107' }}
                      >
                        {getIconWithColor('ui', 'crown', 16, '#ffc107')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Exit Group button */}
            <button
              onClick={openLeaveGroupConfirm}
              disabled={actionLoading}
              style={{
                width: '100%', marginTop: '0.6rem', padding: '0.75rem 1.5rem',
                border: '1px solid rgba(220, 38, 38, 0.4)', borderRadius: 8,
                background: 'transparent', color: '#dc2626',
                fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#dc2626'; }}
            >
              {getThemedIcon('ui', 'x', 16, theme)}
              {actionLoading ? (t('leaving') || 'Leaving...') : (t('chat_leave_group') || 'Leave Group')}
            </button>
          </div>
        )}

        {/* Search Input */}
        <div style={{ padding: '0.6rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <input
            type="text"
            autoComplete="off"
            placeholder={t('chat_search_media_docs') || 'Search media, docs, links...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '6px 10px',
              border: '1px solid var(--border)', borderRadius: 8,
              fontSize: '0.85rem', background: 'var(--bg)', color: 'var(--text)',
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {TABS.map(tab => {
            const count = stats ? (
              tab.key === 'media' ? stats.mediaCount :
              tab.key === 'documents' ? stats.documentCount :
              stats.linkCount
            ) : 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.5rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  color: isActive ? tab.color : 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s',
                }}
              >
                {getIconWithColor('ui', tab.icon, 14, isActive ? tab.color : '#9ca3af')}
                <span>{t(`chat_tab_${tab.key}`) || tab.key}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: '0.65rem',
                    background: isActive ? `${tab.color}20` : 'var(--border)',
                    color: isActive ? tab.color : 'var(--muted)',
                    padding: '1px 5px',
                    borderRadius: 8,
                    fontWeight: 700,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0.75rem',
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              {t('loading') || 'Loading...'}
            </div>
          )}

          {!loading && stats && activeTab === 'media' && (
            <MediaTab items={filterItems(stats.mediaItems)} t={t} isRTL={isRTL} />
          )}

          {!loading && stats && activeTab === 'documents' && (
            <DocumentsTab items={filterItems(stats.documentItems)} t={t} isRTL={isRTL} />
          )}

          {!loading && stats && activeTab === 'links' && (
            <LinksTab items={filterItems(stats.linkItems)} t={t} isRTL={isRTL} />
          )}

          {!loading && stats && (
            (activeTab === 'media' && (searchQuery ? filterItems(stats.mediaItems).length : stats.mediaCount) === 0) ||
            (activeTab === 'documents' && (searchQuery ? filterItems(stats.documentItems).length : stats.documentCount) === 0) ||
            (activeTab === 'links' && (searchQuery ? filterItems(stats.linkItems).length : stats.linkCount) === 0)
          ) && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
              {searchQuery ? (t('chat_no_search_results') || 'No matching items') : (t('chat_no_items') || 'No items found')}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.type === 'assign'
            ? (t('chat_assign_admin') || 'Assign as Admin')
            : confirmModal.type === 'leave_blocked'
            ? (t('chat_cannot_leave_title') || 'Cannot Leave Group')
            : (t('chat_leave_group') || 'Leave Group')
        }
        message={
          confirmModal.type === 'assign'
            ? (t('chat_assign_admin_confirm') || 'Are you sure you want to make this user the new admin? You will lose your admin privileges.')
            : confirmModal.type === 'leave_blocked'
            ? (t('chat_assign_admin_first') || 'You are the only admin of this group. Please assign another member as admin before leaving.')
            : (t('chat_leave_group_confirm') || 'Are you sure you want to leave this group?')
        }
        confirmText={
          confirmModal.type === 'assign'
            ? (t('chat_assign_admin') || 'Assign')
            : confirmModal.type === 'leave_blocked'
            ? (t('ok') || 'OK')
            : (t('chat_leave_group') || 'Leave')
        }
        cancelText={t('cancel') || 'Cancel'}
        loading={actionLoading}
        variant={confirmModal.type === 'leave' ? 'danger' : 'primary'}
        size="small"
      />
    </div>
  );
};

// Media tab - grid of images
const MediaTab = ({ items, t, isRTL }) => {
  if (!items || items.length === 0) return null;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '0.5rem',
    }}>
      {items.map(item => (
        <div
          key={item.id}
          style={{
            aspectRatio: '1',
            borderRadius: 8,
            overflow: 'hidden',
            background: 'var(--border)',
            cursor: 'pointer',
            position: 'relative',
          }}
          onClick={() => item.fileUrl && window.open(item.fileUrl, '_blank')}
          title={item.fileName || ''}
        >
          {item.fileUrl ? (
            <img
              src={item.fileUrl}
              alt={item.fileName || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.display = 'flex';
                e.target.parentElement.style.alignItems = 'center';
                e.target.parentElement.style.justifyContent = 'center';
                e.target.parentElement.innerHTML = `<span style="font-size:1.5rem">📄</span>`;
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.5rem' }}>
              📄
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Documents tab - list of files
const DocumentsTab = ({ items, t, isRTL }) => {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => item.fileUrl && window.open(item.fileUrl, '_blank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.6rem 0.75rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--background)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(37, 99, 235, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {getIconWithColor('ui', 'file', 18, '#2563eb')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.85rem', fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.fileName || 'Unknown file'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
              {item.fileType || 'file'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Links tab - list of URLs
const LinksTab = ({ items, t, isRTL }) => {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => item.url && window.open(item.url, '_blank')}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            padding: '0.6rem 0.75rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--background)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(8, 145, 178, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {getIconWithColor('ui', 'link', 18, '#0891b2')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.8rem', fontWeight: 600,
              color: '#0891b2',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.url}
            </div>
            {item.content && item.content !== item.url && (
              <div style={{
                fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupInfoPanel;
