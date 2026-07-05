/**
 * Attach effective data scope to request (after auth).
 */

import { getEffectiveDataScope } from '../services/scopeResolver.js';

export async function attachDataScope(req, res, next) {
  try {
    if (!req.user) {
      return next();
    }

    const dbId = req.user.dbId;
    const roles = req.user.roles || [];
    req.dataScope = await getEffectiveDataScope(dbId, roles);
    next();
  } catch (error) {
    console.error('[attachDataScope]', error);
    req.dataScope = {
      unrestricted: false,
      categoryIds: [],
      programIds: [],
      subjectIds: [],
      classIds: [],
      source: 'scope_error',
      visibility: {
        programs: 'UCA',
        subjects: 'UCA',
        classes: 'UCA',
        instructors: 'ALL',
        rooms: 'ALL',
      },
      explicitGrants: {
        instructorIds: [],
        roomIds: [],
        programIds: [],
        subjectIds: [],
        classIds: [],
      },
    };
    next();
  }
}

export default attachDataScope;
