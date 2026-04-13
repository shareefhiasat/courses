/**
 * Permissions Routes
 * 
 * PURPOSE: Define API routes for permission management
 * ARCHITECTURE: Routes → Controllers → Services
 */

import { Router } from "express";
import {
  getPermissionsController,
  updatePermissionsController
} from "../controllers/permissions.js";
import { requireAuth, requireSuperAdmin } from "../middleware/keycloakAuth.js";

const router = Router();

// Get all permissions (authenticated users can view)
router.get("/", requireAuth, getPermissionsController);

// Update permissions (super admin only)
router.put("/", requireSuperAdmin, updatePermissionsController);

export default router;
