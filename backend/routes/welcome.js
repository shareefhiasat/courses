import express from 'express';
import { getWelcomePreferences, updateWelcomePreferences } from '../controllers/welcomeController.js';

const router = express.Router();

router.get('/preferences', getWelcomePreferences);
router.patch('/preferences', updateWelcomePreferences);

export default router;
