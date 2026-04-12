/**
 * Nextcloud ACL Sync Routes
 */

import { Router } from 'express';
import {
  getAclMappingController,
  syncUserAclController,
  syncAllUserAclsController
} from '../controllers/nextcloudAclSync.js';

const router = Router();

router.get('/mapping', getAclMappingController);
router.post('/sync-user', syncUserAclController);
router.post('/sync-all', syncAllUserAclsController);

export default router;
