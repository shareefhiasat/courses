import { Router } from 'express';
import {
  createWorkflowTypeConfigController,
  getWorkflowTypeConfigsController,
  getWorkflowTypeConfigByIdController,
  updateWorkflowTypeConfigController,
  deleteWorkflowTypeConfigController,
} from '../controllers/workflowTypeConfig.js';

const router = Router();

router.post('/', createWorkflowTypeConfigController);
router.get('/', getWorkflowTypeConfigsController);
router.get('/:id', getWorkflowTypeConfigByIdController);
router.put('/:id', updateWorkflowTypeConfigController);
router.delete('/:id', deleteWorkflowTypeConfigController);

export default router;
