import React from 'react';
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
  const displayName = displayNameProp || getLocalizedUserName(user, lang, t('drive.unknownUser'));
  const avatarSize = size === 'sm' ? DRIVE_TIMELINE.AVATAR_SIZE_SM : DRIVE_TIMELINE.AVATAR_SIZE;
  const badgeSize = size === 'sm' ? '0.875rem' : '1.125rem';
  const badgeIconSize = size === 'sm' ? 8 : 10;
  const fontSize = size === 'sm' ? '0.625rem' : 'var(--font-size-xs)';
  const colors = getAvatarColor(displayName);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: '9999px',
          background: user?.profileImageUrl ? 'transparent' : colors.bg,
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
        {user?.profileImageUrl ? (
          <img
            src={normalizeProfileImageUrl(user.profileImageUrl)}
            alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            title={t(`roles.${role}`, role)}
          >
            {React.cloneElement(roleIcon, { color: '#ffffff', fill: roleColor, size: badgeIconSize })}
          </div>
        );
      })()}
    </div>
  );
}
