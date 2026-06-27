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
  roleAssignments: { include: { role: true } },
};

export const USER_NAME_SELECT_WITH_REAL = {
  ...USER_NAME_SELECT_WITH_EMAIL,
  realName: true,
};
