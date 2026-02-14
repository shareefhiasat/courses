/**
 * Avatar Utilities
 * Extracted for DRY principle and reusability
 */

export const getAvatarColor = (name) => {
  const colors = [
    { bg: '#e9d5ff', color: '#6b21a8' },
    { bg: '#fed7aa', color: '#9a3412' },
    { bg: '#fecaca', color: '#991b1b' },
    { bg: '#d1fae5', color: '#065f46' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#f3e8ff', color: '#6b21a8' }
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

/**
 * Generate avatar initials from name
 */
export const getAvatarInitials = (name) => {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

