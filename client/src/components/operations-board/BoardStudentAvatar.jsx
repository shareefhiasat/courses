import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/kibo/ui/avatar';
import { getAvatarColor, getAvatarInitials, normalizeProfileImageUrl } from '@utils/avatarUtils';
import { cn } from '@/lib/utils';

function scalePx(base, fontScale = 100) {
  return Math.max(6, Math.round(base * (fontScale / 100)));
}

export default function BoardStudentAvatar({
  name,
  profileImageUrl,
  cacheBuster,
  size = 'md',
  className,
  style,
  fontScale = 100,
  borderColor,
}) {
  const initials = useMemo(() => getAvatarInitials(name), [name]);
  const color = useMemo(() => getAvatarColor(name || ''), [name]);
  const imageSrc = profileImageUrl ? normalizeProfileImageUrl(profileImageUrl, cacheBuster) : null;

  const baseSize = {
    sm: 24,
    md: 32,
    lg: 40,
  }[size] || 32;

  const baseTextSize = {
    sm: 10,
    md: 12,
    lg: 14,
  }[size] || 12;

  const dim = scalePx(baseSize, fontScale);
  const fontSize = scalePx(baseTextSize, fontScale);

  return (
    <Avatar
      className={cn(className)}
      style={{ width: dim, height: dim, fontSize, boxShadow: borderColor ? `0 0 0 2px ${borderColor}` : undefined, ...(style || {}) }}
      data-testid="operations-board-student-avatar"
    >
      {imageSrc && <AvatarImage src={imageSrc} alt={name || ''} />}
      <AvatarFallback
        className="font-medium"
        style={{ backgroundColor: color.bg, color: color.color }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
