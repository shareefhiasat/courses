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
    next(error);
  }
}

export default attachDataScope;
