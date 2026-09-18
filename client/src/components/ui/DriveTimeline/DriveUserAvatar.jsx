import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getAvatarColor, getAvatarInitials, normalizeProfileImageUrl } from '@utils/avatarUtils';
import { getUserRoleFromObject } from '@utils/userUtils';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { DRIVE_TIMELINE } from './constants';

/**
 * Unified user avatar with optional role badge overlay.
 */
export default function DriveUserAvatar({
  user,
  displayName: displayNameProp,
  size = 'md',
  showRoleBadge = true,
}) {
  const { t, lang } = useLang();
  const [imgError, setImgError] = useState(false);
  const displayName = displayNameProp || getLocalizedUserName(user, lang, t('drive.unknownUser'));
  const avatarSize = size === 'sm' ? DRIVE_TIMELINE.AVATAR_SIZE_SM : DRIVE_TIMELINE.AVATAR_SIZE;
  const badgeSize = size === 'sm' ? '0.625rem' : '0.75rem';
  const badgeIconSize = size === 'sm' ? 6 : 7;
  const fontSize = size === 'sm' ? '0.625rem' : 'var(--font-size-xs)';
  const colors = getAvatarColor(displayName);

  let rawImageUrl = user?.profileImageUrl || user?.avatar || user?.image || user?.profileImage;
  // Only trust full HTTP/HTTPS/Data URLs or already-routed API paths; MinIO keys like 'Users/...' 404.
  if (rawImageUrl && !rawImageUrl.startsWith('http://') && !rawImageUrl.startsWith('https://') && !rawImageUrl.startsWith('data:') && !rawImageUrl.startsWith('/api/')) {
    rawImageUrl = null;
  }
  const proxyId = user?.keycloakId || user?.id;
  const cacheBuster = user?.updatedAt || user?.updated_at;
  const token = typeof window !== 'undefined' ? localStorage.getItem('keycloak_token') : null;
  const imageSrc = (() => {
    if (!rawImageUrl && !proxyId) return null;
    const baseUrl = rawImageUrl
      ? normalizeProfileImageUrl(rawImageUrl, cacheBuster)
      : normalizeProfileImageUrl(`/api/v1/user-images/proxy/${proxyId}/profile`, cacheBuster);
    if (!baseUrl || baseUrl.startsWith('http://') || baseUrl.startsWith('https://') || !token) return baseUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
  })();

  useEffect(() => {
    setImgError(false);
  }, [imageSrc]);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: '9999px',
          background: imageSrc && !imgError ? 'transparent' : colors.bg,
          color: colors.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 600,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {imageSrc && !imgError ? (
          <img
            src={imageSrc}
            alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          getAvatarInitials(displayName)
        )}
      </div>
      {showRoleBadge && (() => {
        const role = getUserRoleFromObject(user);
        if (!role) return null;
        const roleIcon = getUserRoleIcon(role);
        const roleColor = getUserRoleColor(role);
        if (!roleIcon) return null;
        return (
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              insetInlineEnd: '-2px',
              width: badgeSize,
              height: badgeSize,
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            {React.cloneElement(roleIcon, { color: '#ffffff', fill: roleColor, size: badgeIconSize })}
          </div>
        );
      })()}
    </div>
  );
}
