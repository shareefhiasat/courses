import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/kibo/ui/avatar';
import { getAvatarColor, getAvatarInitials, normalizeProfileImageUrl } from '@utils/avatarUtils';
import { cn } from '@/lib/utils';

export default function BoardStudentAvatar({
  name,
  profileImageUrl,
  size = 'md',
  className,
}) {
  const initials = useMemo(() => getAvatarInitials(name), [name]);
  const color = useMemo(() => getAvatarColor(name || ''), [name]);
  const imageSrc = profileImageUrl ? normalizeProfileImageUrl(profileImageUrl) : null;

  const sizeClass = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  }[size] || 'h-8 w-8 text-xs';

  return (
    <Avatar className={cn(sizeClass, className)} data-testid="operations-board-student-avatar">
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
