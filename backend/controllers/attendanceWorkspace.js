import * as workspaceDb from '../db/attendance-workspace-postgres.js';
import { applyListScope } from '../utils/applyListScope.js';
import { assertProgramInScope, assertClassInScope } from '../utils/scopeAccess.js';
import { info, error } from '../utils/common/logger.js';

const serviceName = 'attendanceWorkspaceController';

export const getInstructorPrograms = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await workspaceDb.getInstructorPrograms(userId);
    return res.json(result);
  } catch (err) {
    error(`${serviceName}:getInstructorPrograms:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getAllPrograms = async (req, res) => {
  try {
    const result = await applyListScope(req, await workspaceDb.getAllPrograms(), 'program');
    return res.json(result);
  } catch (err) {
    error(`${serviceName}:getAllPrograms:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getScheduleGrid = async (req, res) => {
  try {
    const { programId, instructorId, academicTermId, startDate, endDate } = req.query;
    if (programId) {
      const guard = await assertProgramInScope(req, programId);
      if (!guard.ok) return res.status(403).json({ success: false, error: 'Program out of scope' });
    }
    const result = await workspaceDb.getScheduleGrid({ programId, instructorId, academicTermId, startDate, endDate });
    return res.json(result);
  } catch (err) {
    error(`${serviceName}:getScheduleGrid:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getProgramTerms = async (req, res) => {
  try {
    const { programId } = req.params;
    const instructorId = req.query.instructorId || null;
    if (!programId) {
      return res.status(400).json({ success: false, error: 'programId is required' });
    }
    const guard = await assertProgramInScope(req, programId);
    if (!guard.ok) return res.status(403).json({ success: false, error: 'Program out of scope' });
    const result = await workspaceDb.getProgramTerms({ programId, instructorId });
    return res.json(result);
  } catch (err) {
    error(`${serviceName}:getProgramTerms:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getWeeklySchedule = async (req, res) => {
  try {
    const { programId, academicTermId, instructorId } = req.query;
    if (!programId) {
      return res.status(400).json({ success: false, error: 'programId is required' });
    }
    const guard = await assertProgramInScope(req, programId);
    if (!guard.ok) return res.status(403).json({ success: false, error: 'Program out of scope' });
    const result = await workspaceDb.getWeeklySchedule({
      programId,
      academicTermId,
      instructorId: instructorId || null,
    });
    return res.json(result);
  } catch (err) {
    error(`${serviceName}:getWeeklySchedule:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getScheduleStatus = async (req, res) => {
  try {
    const { classIds, date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, error: 'date is required' });
    }

    const ids = classIds ? classIds.split(',').map((id) => parseInt(id)).filter(Boolean) : [];
    // Scope: drop classes the user can't access
    const scoped = await Promise.all(ids.map(async (id) => (await assertClassInScope(req, id)).ok ? id : null));
    const scopedIds = scoped.filter((id) => id != null);
    const result = await workspaceDb.getScheduleStatus({ classIds: scopedIds, date });
    return res.json(result);
  } catch (err) {
    error(`${serviceName}:getScheduleStatus:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export default {
  getInstructorPrograms,
  getAllPrograms,
  getProgramTerms,
  getWeeklySchedule,
  getScheduleGrid,
  getScheduleStatus,
};
