/**
 * Military LMS - API Server
 * 
 * PURPOSE: Serves API routes → Service Layer → Prisma → PostgreSQL
 * ARCHITECTURE: Frontend → API Server → Business Services → DB Services → PostgreSQL
 * RUN: node server.js
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== SERVICE LAYER ====================

// Import business services from backend
import programBusinessService from './backend/services/programs.js';
import classBusinessService from './backend/services/classes.js';
import subjectBusinessService from './backend/services/subjects.js';
import activityBusinessService from './backend/services/activities.js';

// ==================== PROGRAMS API ====================

// GET /api/programs - Get all programs
app.get('/api/programs', async (req, res) => {
  try {
    console.log('[API Server] Getting programs with query:', req.query);
    const result = await programBusinessService.getAllPrograms(req.query);
    console.log('[API Server] Programs result:', result);
    res.json(result);
  } catch (error) {
    console.error('[API Server] Error getting programs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/programs/:id - Get program by ID
app.get('/api/programs/:id', async (req, res) => {
  try {
    const result = await programBusinessService.getProgramById(req.params.id, req.query);
    res.json(result);
  } catch (error) {
    console.error('Error getting program:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/programs - Create program
app.post('/api/programs', async (req, res) => {
  try {
    const result = await programBusinessService.createProgram(req.body, req.user);
    res.json(result);
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/programs/:id - Update program
app.put('/api/programs/:id', async (req, res) => {
  try {
    const result = await programBusinessService.updateProgram(req.params.id, req.body, req.user);
    res.json(result);
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/programs/:id - Soft delete program
app.delete('/api/programs/:id', async (req, res) => {
  try {
    const result = await programBusinessService.deleteProgram(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SUBJECTS API ====================

// GET /api/subjects - Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    console.log('[API Server] Getting subjects with query:', req.query);
    const result = await subjectBusinessService.getAllSubjects(req.query);
    console.log('[API Server] Subjects result:', result);
    res.json(result);
  } catch (error) {
    console.error('[API Server] Error getting subjects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subjects/:id - Get subject by ID
app.get('/api/subjects/:id', async (req, res) => {
  try {
    const result = await subjectBusinessService.getSubjectById(req.params.id, req.query);
    res.json(result);
  } catch (error) {
    console.error('Error getting subject:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CLASSES API ====================

// GET /api/classes - Get all classes
app.get('/api/classes', async (req, res) => {
  try {
    console.log('[API Server] Getting classes with query:', req.query);
    const result = await classBusinessService.getAllClasses(req.query);
    console.log('[API Server] Classes result:', result);
    res.json(result);
  } catch (error) {
    console.error('[API Server] Error getting classes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/classes/:id - Get class by ID
app.get('/api/classes/:id', async (req, res) => {
  try {
    const result = await classBusinessService.getClassById(req.params.id, req.query);
    res.json(result);
  } catch (error) {
    console.error('Error getting class:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/classes - Create class
app.post('/api/classes', async (req, res) => {
  try {
    const result = await classBusinessService.createClass(req.body, req.user);
    res.json(result);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/classes/:id - Update class
app.put('/api/classes/:id', async (req, res) => {
  try {
    const result = await classBusinessService.updateClass(req.params.id, req.body, req.user);
    res.json(result);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/classes/:id - Delete class
app.delete('/api/classes/:id', async (req, res) => {
  try {
    const result = await classBusinessService.deleteClass(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Military LMS API Server running on http://localhost:${PORT}
📡 API Base URL: http://localhost:${PORT}/api
📊 Health Check: http://localhost:${PORT}/api/health
🏗️ Architecture: Frontend → API → Business Services → DB Services → PostgreSQL
  `);
});
