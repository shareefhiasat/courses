import { Router } from 'express';
import * as fileService from '../services/fileService.js';

const router = Router();

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await fileService.getFileByPublicToken(token);

    if (!result.success) {
      return res.status(result.error.code === 'INVALID_TOKEN' ? 404 : 400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[publicDrive] Get public file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve public file',
    });
  }
});

export default router;
