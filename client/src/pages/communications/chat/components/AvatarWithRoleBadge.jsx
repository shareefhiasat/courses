import React from 'react';
import { resolveUserRole } from '@utils/userUtils';
import { getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { getChatUserDisplayName } from '@utils/userUtils';

const withAuthToken = (url) => {
  if (!url) return url;
  const token = localStorage.getItem('keycloak_token');
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
};

const AvatarWithRoleBadge = ({
  user,
  size = 40,
  badgeSize = 16,
  iconSize = 10,
  showRoleLabel = false,
  t,
  style,
}) => {
  if (!user) return null;

  const displayName = getChatUserDisplayName(user);
  const role = resolveUserRole(user);
  const roleIcon = role ? getUserRoleIcon(role) : null;
  const roleColor = role ? getUserRoleColor(role) : null;
  const avatarColor = getAvatarColor(displayName);
  const imageUrl = user.profileImageUrl ? withAuthToken(user.profileImageUrl) : null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: imageUrl ? 'transparent' : avatarColor.bg,
          color: avatarColor.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size <= 28 ? '0.8rem' : '1rem',
          fontWeight: 600,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: imageUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {getAvatarInitials(displayName)}
        </div>
      </div>
      {roleIcon && (
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            insetInlineEnd: '-2px',
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
          title={showRoleLabel && t ? t(`role_label_${role}`) || role : role}
        >
          {React.cloneElement(roleIcon, { color: '#ffffff', fill: roleColor, size: iconSize })}
        </div>
      )}
    </div>
  );
};

export default AvatarWithRoleBadge;
