/**
 * User dashboard preferences — per-user widget layouts in PostgreSQL.
 */

import {
  getDashboardPreferences,
  saveDashboardPreferences,
  deleteDashboardPreferences,
  getTypographyPreferences,
  saveTypographyPreferences,
} from '../db/user-preferences-postgres.js';
import {
  DEFAULT_FONT_LTR,
  DEFAULT_FONT_RTL,
  DEFAULT_TEXT_SIZE,
  isValidFontId,
  isValidTextSize,
} from '../config/typographyAllowlist.js';

export async function getDashboard(req, res) {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { dashboardKey } = req.params;
    if (!dashboardKey) {
      return res.status(400).json({ success: false, error: 'dashboardKey is required' });
    }

    const result = await getDashboardPreferences(userId, dashboardKey);
    return res.json(result);
  } catch (error) {
    console.error('[user-preferences.getDashboard]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function saveDashboard(req, res) {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { dashboardKey } = req.params;
    const { widgets, pinnedIds } = req.body || {};

    if (!dashboardKey) {
      return res.status(400).json({ success: false, error: 'dashboardKey is required' });
    }
    if (!Array.isArray(widgets)) {
      return res.status(400).json({ success: false, error: 'widgets must be an array' });
    }

    const result = await saveDashboardPreferences(
      userId,
      dashboardKey,
      { widgets, pinnedIds: pinnedIds || [] },
      userId,
    );
    return res.json(result);
  } catch (error) {
    console.error('[user-preferences.saveDashboard]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function resetDashboard(req, res) {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { dashboardKey } = req.params;
    if (!dashboardKey) {
      return res.status(400).json({ success: false, error: 'dashboardKey is required' });
    }

    const result = await deleteDashboardPreferences(userId, dashboardKey, userId);
    return res.json(result);
  } catch (error) {
    console.error('[user-preferences.resetDashboard]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getTypography(req, res) {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await getTypographyPreferences(userId);
    const typography = result.data;
    const data = typography?.fontLtr && typography?.fontRtl
      ? { textSize: DEFAULT_TEXT_SIZE, ...typography }
      : { fontLtr: DEFAULT_FONT_LTR, fontRtl: DEFAULT_FONT_RTL, textSize: DEFAULT_TEXT_SIZE };

    return res.json({ success: true, data });
  } catch (error) {
    console.error('[user-preferences.getTypography]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function saveTypography(req, res) {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { fontLtr, fontRtl, textSize } = req.body || {};

    if (!isValidFontId('ltr', fontLtr)) {
      return res.status(400).json({ success: false, error: `Invalid LTR font: ${fontLtr}` });
    }
    if (!isValidFontId('rtl', fontRtl)) {
      return res.status(400).json({ success: false, error: `Invalid RTL font: ${fontRtl}` });
    }
    if (textSize != null && !isValidTextSize(textSize)) {
      return res.status(400).json({ success: false, error: `Invalid text size: ${textSize}` });
    }

    const result = await saveTypographyPreferences(userId, { fontLtr, fontRtl, textSize }, userId);
    return res.json(result);
  } catch (error) {
    console.error('[user-preferences.saveTypography]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
