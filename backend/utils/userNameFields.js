/**
 * Shared Prisma select fragments for User name fields (English + Arabic).
 */

export const USER_NAME_SELECT = {
  displayName: true,
  firstName: true,
  lastName: true,
  displayNameAr: true,
  firstNameAr: true,
  lastNameAr: true,
};

export const USER_NAME_SELECT_WITH_EMAIL = {
  ...USER_NAME_SELECT,
  email: true,
};

export const USER_NAME_SELECT_WITH_ID = {
  id: true,
  ...USER_NAME_SELECT_WITH_EMAIL,
};

export const USER_NAME_SELECT_WITH_ROLE = {
  ...USER_NAME_SELECT_WITH_ID,
  keycloakId: true,
  profileImageUrl: true,
  roleAssignments: { include: { role: true } },
};

export const USER_NAME_SELECT_WITH_REAL = {
  ...USER_NAME_SELECT_WITH_EMAIL,
  realName: true,
};

/**
 * Normalize a user object's profileImageUrl from a raw DB key to a usable proxy URL.
 * Returns the user unchanged if profileImageUrl is already a URL or is missing.
 */
export const normalizeProfileImageUrl = (user) => {
  if (!user) return user;
  if (!user.profileImageUrl) return user;
  if (user.profileImageUrl.startsWith('http') || user.profileImageUrl.startsWith('/api/')) return user;
  return {
    ...user,
    profileImageUrl: `/api/v1/user-images/proxy/${user.keycloakId}/profile`,
  };
};
